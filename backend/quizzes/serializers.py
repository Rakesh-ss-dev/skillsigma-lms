from rest_framework import serializers
from django.db import transaction
from .models import Quiz, Question, Option, Submission, StudentAnswer

# --- 1. Option Serializer ---
class OptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']


# --- 2. Question Serializer (Must be defined BEFORE QuizSerializer) ---
class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'short_answer', 'options']
        extra_kwargs = {
            'text': {'validators': []} # Allow duplicate text for different quizzes if needed
        }

    @transaction.atomic
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        
        # Check if question exists by Text to prevent crash
        text = validated_data.get('text')
        existing_q = Question.objects.filter(text=text).first()
        if existing_q:
            return existing_q

        question = Question.objects.create(**validated_data)
        Option.objects.bulk_create([
            Option(question=question, **opt) for opt in options_data
        ])
        return question

    @transaction.atomic
    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            posted_ids = {opt.get('id') for opt in options_data if opt.get('id')}
            instance.options.exclude(id__in=posted_ids).delete()

            existing_options = {opt.id: opt for opt in instance.options.all()}
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


# --- 3. Quiz Serializer ---
class QuizSerializer(serializers.ModelSerializer):
    # This links the QuestionSerializer so questions appear in the JSON
    questions = QuestionSerializer(many=True)
    prerequisite_lesson_title = serializers.ReadOnlyField(source='prerequisite_lesson.title')

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'lesson', 'title', 'description', 'time_limit', 
            'prerequisite_lesson', 'prerequisite_lesson_title',
            'questions'
        ]

    # Note: get_queryset() was removed from here. It belongs in views.py.

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Handle cases where lesson might be None
        if instance.lesson_id:
            representation['lesson'] = {
                "id": instance.lesson_id,
                "title": getattr(instance.lesson, 'title', str(instance.lesson_id)),
            }
        return representation

    @transaction.atomic
    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        self._sync_questions(quiz, questions_data)
        return quiz

    @transaction.atomic
    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            self._sync_questions(instance, questions_data)
        return instance

    def _sync_questions(self, quiz, questions_data):
        qs_to_link = []
        for q_data in questions_data:
            q_id = q_data.get('id')
            q_text = q_data.get('text')

            # Logic to reuse existing questions or create new ones
            if q_id and Question.objects.filter(id=q_id).exists():
                qs_to_link.append(Question.objects.get(id=q_id))
            elif q_text and Question.objects.filter(text=q_text).exists():
                qs_to_link.append(Question.objects.get(text=q_text))
            else:
                if 'id' in q_data: del q_data['id']
                serializer = QuestionSerializer(data=q_data)
                if serializer.is_valid(raise_exception=True):
                    new_q = serializer.save()
                    qs_to_link.append(new_q)
        
        quiz.questions.set(qs_to_link)


# --- 4. Submission & Answer Serializers ---
class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ['id', 'question', 'selected_option', 'text_answer', 'is_correct']

class SubmissionSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True)
    student = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'quiz', 'student', 'score', 'submitted_at', 'answers']
        read_only_fields = ['score', 'submitted_at']

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        quiz = validated_data.get('quiz')

        # --- 1. DUPLICATE CHECK ---
        # Check if this user has already submitted this specific quiz
        if Submission.objects.filter(student=user, quiz=quiz).exists():
            raise serializers.ValidationError(
                {"detail": "You have already submitted this quiz. Multiple submissions are not allowed."}
            )

        # --- 2. EXTRACT DATA ---
        answers_data = validated_data.pop('answers')

        # --- 3. CREATE SUBMISSION ---
        submission = Submission.objects.create(student=user, score=0, **validated_data)

        # --- 4. CALCULATE SCORE & SAVE ANSWERS ---
        answers_to_create = []
        total_score = 0

        for ans_data in answers_data:
            question = ans_data.get('question')
            selected_option = ans_data.get('selected_option')
            text_answer = ans_data.get('text_answer')
            
            is_correct = False
            points_awarded = 0

            # Logic for MCQ/TF
            if question.question_type in ['mcq', 'tf']:
                if selected_option and selected_option.question_id == question.id:
                    if selected_option.is_correct:
                        is_correct = True
                        points_awarded = question.points

            # Logic for Short Answer
            elif question.question_type == 'short':
                if text_answer and question.short_answer:
                    if text_answer.strip().lower() == question.short_answer.strip().lower():
                        is_correct = True
                        points_awarded = question.points

            if is_correct:
                total_score += points_awarded

            answers_to_create.append(
                StudentAnswer(
                    submission=submission,
                    question=question,
                    selected_option=selected_option,
                    text_answer=text_answer,
                    is_correct=is_correct,
                    points_awarded=points_awarded
                )
            )

        StudentAnswer.objects.bulk_create(answers_to_create)

        submission.score = total_score
        submission.save()

        return submission