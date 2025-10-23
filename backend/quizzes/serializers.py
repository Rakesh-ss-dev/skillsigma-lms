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

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        text = validated_data.get('text')

        # ✅ Check if question already exists
        question, created = Question.objects.get_or_create(
            text=text,
            defaults=validated_data
        )

        # ✅ Add options (without duplicates)
        for option_data in options_data:
            Option.objects.get_or_create(
                question=question,
                text=option_data['text'],
                defaults={'is_correct': option_data.get('is_correct', False)}
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
            options_data = question_data.pop('options', [])
            text = question_data.get('text')

            # ✅ Check if question exists globally
            question, _ = Question.objects.get_or_create(
                text=text,
                defaults=question_data
            )

            # ✅ Attach or create options if needed
            for option_data in options_data:
                Option.objects.get_or_create(
                    question=question,
                    text=option_data['text'],
                    defaults={'is_correct': option_data.get('is_correct', False)}
                )

            quiz.questions.add(question)

        return quiz



class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'quiz', 'student', 'score', 'submitted_at']


