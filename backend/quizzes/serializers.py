from rest_framework import serializers
from .models import Quiz, Question, Option, Submission

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']

    def update(self, instance, validated_data):
        instance.text = validated_data.get('text', instance.text)
        instance.is_correct = validated_data.get('is_correct', instance.is_correct)
        instance.save()
        return instance


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'short_answer', 'options']
        extra_kwargs = {'text': {'validators': []}}

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)

        for option_data in options_data:
            Option.objects.create(question=question, **option_data)

        return question

    def update(self, instance, validated_data):
        # Update basic fields
        instance.text = validated_data.get('text', instance.text)
        instance.question_type = validated_data.get('question_type', instance.question_type)
        instance.points = validated_data.get('points', instance.points)
        instance.short_answer = validated_data.get('short_answer', instance.short_answer)
        instance.save()

        # Handle nested options
        options_data = validated_data.get('options', [])

        if options_data:
            existing_ids = [opt.id for opt in instance.options.all()]
            sent_ids = [opt.get('id') for opt in options_data if opt.get('id')]

            # Delete removed options
            for opt in instance.options.all():
                if opt.id not in sent_ids:
                    opt.delete()

            # Create or update options
            for option_data in options_data:
                option_id = option_data.get('id', None)
                if option_id and option_id in existing_ids:
                    option_instance = Option.objects.get(id=option_id, question=instance)
                    OptionSerializer().update(option_instance, option_data)
                else:
                    Option.objects.create(question=instance, **option_data)

        return instance

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

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.time_limit = validated_data.get('time_limit', instance.time_limit)
        instance.save()

        questions_data = validated_data.get('questions', [])

        if questions_data:
            existing_question_ids = [q.id for q in instance.questions.all()]
            sent_question_ids = [q.get('id') for q in questions_data if q.get('id')]

            # Remove questions not in payload
            for q in instance.questions.all():
                if q.id not in sent_question_ids:
                    instance.questions.remove(q)

            for question_data in questions_data:
                question_text = question_data.get('text')

                # Try to get or create question to avoid duplicate text
                question, created = Question.objects.get_or_create(
                    text=question_text,
                    defaults={
                        'question_type': question_data.get('question_type', 'single'),
                        'points': question_data.get('points', 1),
                        'short_answer': question_data.get('short_answer', ''),
                    }
                )

                # Update question if it already exists
                QuestionSerializer().update(question, question_data)
                instance.questions.add(question)

        return instance



class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'quiz', 'student', 'score', 'submitted_at']


