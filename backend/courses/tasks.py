# courses/tasks.py
import os
import subprocess
import tempfile
from celery import shared_task
from django.core.files.base import ContentFile
from django.apps import apps

@shared_task
def convert_lesson_to_pdf(lesson_id):
    """
    Background task to convert Lesson content_file to PDF.
    """
    # Lazy load the model to avoid circular imports
    Lesson = apps.get_model('courses', 'Lesson') 
    
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return "Lesson not found"

    if not lesson.content_file:
        return "No file to convert"

    # Get file info
    file_name, ext = os.path.splitext(lesson.content_file.name)
    ext = ext.lower()
    
    # Double check extension inside the task (safety)
    allowed_extensions = ['.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx']
    if ext not in allowed_extensions:
        return f"Skipping conversion for {ext}"

    # --- CONVERSION LOGIC START ---
    
    # 1. Create a temp input file (Storage Agnostic: works with S3 or Local)
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_input:
        lesson.content_file.open('rb') # Open the file
        temp_input.write(lesson.content_file.read()) # Read content
        temp_input.flush()
        temp_input_path = temp_input.name
        lesson.content_file.close() # Close file handle

    # 2. Define temp output directory
    temp_output_dir = tempfile.mkdtemp()

    try:
        # 3. Run LibreOffice
        # Note: Ensure 'soffice' is in your System PATH
        subprocess.run(
            ['soffice', '--headless', '--convert-to', 'pdf', temp_input_path, '--outdir', temp_output_dir],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # 4. Construct output path
        # LibreOffice uses the temp filename for output
        temp_input_filename = os.path.basename(temp_input_path)
        pdf_output_filename = os.path.splitext(temp_input_filename)[0] + ".pdf"
        output_path = os.path.join(temp_output_dir, pdf_output_filename)

        # 5. Save back to Django
        if os.path.exists(output_path):
            with open(output_path, 'rb') as pdf_file:
                # Create the new filename based on the ORIGINAL upload name
                original_clean_name = os.path.basename(file_name) 
                new_db_filename = f"{original_clean_name}.pdf"
                
                # Update the field
                lesson.content_file.save(new_db_filename, ContentFile(pdf_file.read()), save=False)
                
                # Explicitly save only this field to avoid triggering signals again unnecessarily
                lesson.save(update_fields=['content_file'])
                
            return "Conversion Successful"
            
    except subprocess.CalledProcessError as e:
        return f"LibreOffice Error: {e}"
        
    finally:
        # 6. Cleanup
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
        if os.path.exists(temp_output_dir):
            import shutil
            shutil.rmtree(temp_output_dir)