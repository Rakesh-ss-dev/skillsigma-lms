from rest_framework import serializers
from django.db import transaction
from .models import Quiz, Question, Option, Submission

class OptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'short_answer', 'options']
        # CRITICAL: This allows us to handle duplicate text validation manually 
        # so we can "link" existing questions instead of crashing.
        extra_kwargs = {
            'text': {'validators': []}
        }

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)

        Option.objects.bulk_create([
            Option(question=question, **opt) for opt in options_data
        ])
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            existing_options = {opt.id: opt for opt in instance.options.all()}
            posted_ids = {opt.get('id') for opt in options_data if opt.get('id')}

            # Delete removed options
            for opt_id, opt_instance in existing_options.items():
                if opt_id not in posted_ids:
                    opt_instance.delete()

            # Update or Create options
            for opt_data in options_data:
                opt_id = opt_data.get('id')
                if opt_id and opt_id in existing_options:
                    serializer = OptionSerializer(existing_options[opt_id], data=opt_data, partial=True)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()
                else:
                    if 'id' in opt_data: del opt_data['id']
                    Option.objects.create(question=instance, **opt_data)

        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ['id', 'course', 'lesson', 'title', 'description', 'time_limit', 'questions']

    def to_representation(self, instance):
        """
        Custom representation to populate the 'lesson' field with details
        instead of just the ID when fetching the quiz.
        """
        representation = super().to_representation(instance)
        print("Original representation:", representation)
        # Check instance.lesson_id to ensure we have a relationship before accessing .lesson
        if instance.lesson_id:
            try:
                lesson = instance.lesson
                print("Lesson fetched successfully:", lesson)
                representation['lesson'] = {
                    "id": lesson.id,
                    "title": getattr(lesson, 'title', str(lesson)),
                }
            except Exception:
                representation['lesson'] = instance.lesson_id
            
        return representation

    @transaction.atomic
    def create(self, validated_data):
        """
        Creates a new Quiz and handles nested questions.
        - If a question has an ID and exists: Link it to this new quiz.
        - If a question has no ID: Create it and link it.
        """
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)

        for q_data in questions_data:
            q_id = q_data.get('id')

            if q_id and Question.objects.filter(id=q_id).exists():
                # CASE 1: Link Existing Question
                existing_q = Question.objects.get(id=q_id)
                
                # Optional: Update the question with new data if provided
                # This keeps the question bank up to date
                serializer = QuestionSerializer(existing_q, data=q_data, partial=True)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                
                quiz.questions.add(existing_q)
            
            else:
                # CASE 2: Create New Question
                # Remove ID if present but invalid/temporary
                if 'id' in q_data: del q_data['id']
                
                serializer = QuestionSerializer(data=q_data)
                if serializer.is_valid(raise_exception=True):
                    new_q = serializer.save()
                    quiz.questions.add(new_q)

        return quiz

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Updates an existing Quiz.
        - Updates quiz details.
        - Syncs the questions list (Add new, Link existing, Remove missing).
        """
        # Default to None to distinguish between "empty list" (delete all) vs "missing field" (ignore)
        questions_data = validated_data.pop('questions', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            # Current questions in this quiz
            current_quiz_question_ids = set(instance.questions.values_list('id', flat=True))
            incoming_ids = set()

            for q_data in questions_data:
                q_id = q_data.get('id')

                if q_id and Question.objects.filter(id=q_id).exists():
                    # Update & Link Existing
                    existing_q = Question.objects.get(id=q_id)
                    serializer = QuestionSerializer(existing_q, data=q_data, partial=True)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()
                    
                    instance.questions.add(existing_q)
                    incoming_ids.add(existing_q.id)
                else:
                    # Create New & Link
                    if 'id' in q_data: del q_data['id']
                    serializer = QuestionSerializer(data=q_data)
                    if serializer.is_valid(raise_exception=True):
                        new_q = serializer.save()
                        instance.questions.add(new_q)
                        incoming_ids.add(new_q.id)

            # Optional: Unlink questions that were removed from the payload
            # (Does not delete the question from DB, just removes from this Quiz)
            for old_id in current_quiz_question_ids:
                if old_id not in incoming_ids:
                    instance.questions.remove(old_id)

        return instance


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'quiz', 'student', 'score', 'submitted_at']