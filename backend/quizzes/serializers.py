from rest_framework import serializers
from .models import Quiz, Question, Option, Submission

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'short_answer', 'options']
        # Don't use validators that enforce unique text here
        extra_kwargs = {
            'text': {'validators': []}
        }

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        text = validated_data.get('text')

        # Use get_or_create to reuse existing questions
        question, created = Question.objects.get_or_create(
            text=text,
            defaults=validated_data
        )

        # Only create options if question is newly created
        if created:
            for option_data in options_data:
                Option.objects.create(
                    question=question,
                    text=option_data['text'],
                    is_correct=option_data.get('is_correct', False)
                )

        return question


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ['id', 'course', 'title', 'description', 'time_limit', 'questions']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)

        for question_data in questions_data:
            question_serializer = QuestionSerializer(data=question_data)
            question_serializer.is_valid(raise_exception=True)
            question = question_serializer.save()
            quiz.questions.add(question)

        return quiz


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'quiz', 'student', 'score', 'submitted_at']


