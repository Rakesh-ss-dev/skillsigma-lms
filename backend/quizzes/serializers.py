from rest_framework import serializers
from django.db import transaction
from .models import Quiz, Question, Option, Submission, StudentAnswer

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
        # Remove validators to manually handle the 'unique' text constraint
        extra_kwargs = {
            'text': {'validators': []}
        }

    @transaction.atomic
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        
        # 1. FIX: Check if question exists by Text to prevent "Unique Constraint Failed" crash
        text = validated_data.get('text')
        existing_q = Question.objects.filter(text=text).first()
        
        if existing_q:
            return existing_q

        # 2. Create New if not exists
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


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    prerequisite_lesson_title = serializers.ReadOnlyField(source='prerequisite_lesson.title')

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'lesson', 'title', 'description', 'time_limit', 
            'prerequisite_lesson', 'prerequisite_lesson_title',
            'questions'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
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

            # Prioritize finding existing questions to reuse them
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

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ['id', 'question', 'selected_option', 'text_answer', 'is_correct']

class SubmissionSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)
    class Meta:
        model = Submission
        fields = ['id', 'quiz', 'student', 'score', 'submitted_at', 'answers']