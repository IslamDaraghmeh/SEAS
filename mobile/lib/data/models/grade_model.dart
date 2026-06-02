import 'package:equatable/equatable.dart';

/// Grade Model for SEAS Mobile App
class GradeModel extends Equatable {
  final String id;
  final String examId;
  final String courseId;
  final String courseName;
  final String? courseNameAr;
  final String courseCode;
  final String examType;
  final double grade;
  final double maxGrade;
  final double percentage;
  final String? letterGrade;
  final double? classAverage;
  final double? classHighest;
  final double? classLowest;
  final String? feedback;
  final String? feedbackAr;
  final bool isPublished;
  final DateTime? publishedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const GradeModel({
    required this.id,
    required this.examId,
    required this.courseId,
    required this.courseName,
    this.courseNameAr,
    required this.courseCode,
    required this.examType,
    required this.grade,
    required this.maxGrade,
    required this.percentage,
    this.letterGrade,
    this.classAverage,
    this.classHighest,
    this.classLowest,
    this.feedback,
    this.feedbackAr,
    this.isPublished = true,
    this.publishedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory GradeModel.fromJson(Map<String, dynamic> json) {
    final grade = (json['grade'] ?? 0).toDouble();
    final maxGrade = (json['max_grade'] ?? json['maxGrade'] ?? 100).toDouble();
    final percentage = maxGrade > 0 ? (grade / maxGrade) * 100 : 0.0;

    return GradeModel(
      id: json['id']?.toString() ?? '',
      examId: json['exam_id']?.toString() ?? json['examId']?.toString() ?? '',
      courseId:
          json['course_id']?.toString() ?? json['courseId']?.toString() ?? '',
      courseName: json['course_name'] ?? json['courseName'] ?? '',
      courseNameAr: json['course_name_ar'] ?? json['courseNameAr'],
      courseCode: json['course_code'] ?? json['courseCode'] ?? '',
      examType: json['exam_type'] ?? json['examType'] ?? 'midterm',
      grade: grade,
      maxGrade: maxGrade,
      percentage: json['percentage']?.toDouble() ?? percentage,
      letterGrade: json['letter_grade'] ?? json['letterGrade'],
      classAverage: json['class_average']?.toDouble() ??
          json['classAverage']?.toDouble(),
      classHighest: json['class_highest']?.toDouble() ??
          json['classHighest']?.toDouble(),
      classLowest:
          json['class_lowest']?.toDouble() ?? json['classLowest']?.toDouble(),
      feedback: json['feedback'],
      feedbackAr: json['feedback_ar'] ?? json['feedbackAr'],
      isPublished: json['is_published'] ?? json['isPublished'] ?? true,
      publishedAt: json['published_at'] != null
          ? DateTime.tryParse(json['published_at'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'course_id': courseId,
      'course_name': courseName,
      'course_name_ar': courseNameAr,
      'course_code': courseCode,
      'exam_type': examType,
      'grade': grade,
      'max_grade': maxGrade,
      'percentage': percentage,
      'letter_grade': letterGrade,
      'class_average': classAverage,
      'class_highest': classHighest,
      'class_lowest': classLowest,
      'feedback': feedback,
      'feedback_ar': feedbackAr,
      'is_published': isPublished,
      'published_at': publishedAt?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  GradeModel copyWith({
    String? id,
    String? examId,
    String? courseId,
    String? courseName,
    String? courseNameAr,
    String? courseCode,
    String? examType,
    double? grade,
    double? maxGrade,
    double? percentage,
    String? letterGrade,
    double? classAverage,
    double? classHighest,
    double? classLowest,
    String? feedback,
    String? feedbackAr,
    bool? isPublished,
    DateTime? publishedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return GradeModel(
      id: id ?? this.id,
      examId: examId ?? this.examId,
      courseId: courseId ?? this.courseId,
      courseName: courseName ?? this.courseName,
      courseNameAr: courseNameAr ?? this.courseNameAr,
      courseCode: courseCode ?? this.courseCode,
      examType: examType ?? this.examType,
      grade: grade ?? this.grade,
      maxGrade: maxGrade ?? this.maxGrade,
      percentage: percentage ?? this.percentage,
      letterGrade: letterGrade ?? this.letterGrade,
      classAverage: classAverage ?? this.classAverage,
      classHighest: classHighest ?? this.classHighest,
      classLowest: classLowest ?? this.classLowest,
      feedback: feedback ?? this.feedback,
      feedbackAr: feedbackAr ?? this.feedbackAr,
      isPublished: isPublished ?? this.isPublished,
      publishedAt: publishedAt ?? this.publishedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Get course name based on locale
  String getCourseName(String locale) {
    if (locale == 'ar' && courseNameAr != null && courseNameAr!.isNotEmpty) {
      return courseNameAr!;
    }
    return courseName;
  }

  /// Get feedback based on locale
  String? getFeedback(String locale) {
    if (locale == 'ar' && feedbackAr != null && feedbackAr!.isNotEmpty) {
      return feedbackAr;
    }
    return feedback;
  }

  /// Get letter grade from percentage
  String get calculatedLetterGrade {
    if (letterGrade != null) return letterGrade!;

    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 65) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /// Get grade color based on percentage
  String get gradeColorHex {
    if (percentage >= 90) return '#4CAF50'; // Green
    if (percentage >= 80) return '#8BC34A'; // Light Green
    if (percentage >= 70) return '#FFEB3B'; // Yellow
    if (percentage >= 60) return '#FF9800'; // Orange
    return '#E53935'; // Red
  }

  /// Check if grade is passing
  bool get isPassing => percentage >= 60;

  /// Check if student performed above average
  bool get isAboveAverage {
    if (classAverage == null) return false;
    return grade > classAverage!;
  }

  @override
  List<Object?> get props => [
        id,
        examId,
        courseId,
        courseName,
        courseNameAr,
        courseCode,
        examType,
        grade,
        maxGrade,
        percentage,
        letterGrade,
        classAverage,
        classHighest,
        classLowest,
        feedback,
        feedbackAr,
        isPublished,
        publishedAt,
        createdAt,
        updatedAt,
      ];
}

/// GPA Summary Model
class GpaSummary extends Equatable {
  final double cumulativeGpa;
  final double semesterGpa;
  final int totalCredits;
  final int completedCredits;
  final int totalCourses;
  final int completedCourses;
  final String? standing;
  final String? standingAr;

  const GpaSummary({
    required this.cumulativeGpa,
    required this.semesterGpa,
    required this.totalCredits,
    required this.completedCredits,
    required this.totalCourses,
    required this.completedCourses,
    this.standing,
    this.standingAr,
  });

  factory GpaSummary.fromJson(Map<String, dynamic> json) {
    return GpaSummary(
      cumulativeGpa:
          (json['cumulative_gpa'] ?? json['cumulativeGpa'] ?? 0).toDouble(),
      semesterGpa:
          (json['semester_gpa'] ?? json['semesterGpa'] ?? 0).toDouble(),
      totalCredits: json['total_credits'] ?? json['totalCredits'] ?? 0,
      completedCredits:
          json['completed_credits'] ?? json['completedCredits'] ?? 0,
      totalCourses: json['total_courses'] ?? json['totalCourses'] ?? 0,
      completedCourses:
          json['completed_courses'] ?? json['completedCourses'] ?? 0,
      standing: json['standing'],
      standingAr: json['standing_ar'] ?? json['standingAr'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cumulative_gpa': cumulativeGpa,
      'semester_gpa': semesterGpa,
      'total_credits': totalCredits,
      'completed_credits': completedCredits,
      'total_courses': totalCourses,
      'completed_courses': completedCourses,
      'standing': standing,
      'standing_ar': standingAr,
    };
  }

  String getStanding(String locale) {
    if (locale == 'ar' && standingAr != null && standingAr!.isNotEmpty) {
      return standingAr!;
    }
    return standing ?? '';
  }

  @override
  List<Object?> get props => [
        cumulativeGpa,
        semesterGpa,
        totalCredits,
        completedCredits,
        totalCourses,
        completedCourses,
        standing,
        standingAr,
      ];
}

/// Grade Breakdown Item
class GradeBreakdownItem extends Equatable {
  final String name;
  final String? nameAr;
  final double grade;
  final double maxGrade;
  final double weight;

  const GradeBreakdownItem({
    required this.name,
    this.nameAr,
    required this.grade,
    required this.maxGrade,
    required this.weight,
  });

  factory GradeBreakdownItem.fromJson(Map<String, dynamic> json) {
    return GradeBreakdownItem(
      name: json['name'] ?? '',
      nameAr: json['name_ar'] ?? json['nameAr'],
      grade: (json['grade'] ?? 0).toDouble(),
      maxGrade: (json['max_grade'] ?? json['maxGrade'] ?? 100).toDouble(),
      weight: (json['weight'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'name_ar': nameAr,
      'grade': grade,
      'max_grade': maxGrade,
      'weight': weight,
    };
  }

  String getName(String locale) {
    if (locale == 'ar' && nameAr != null && nameAr!.isNotEmpty) {
      return nameAr!;
    }
    return name;
  }

  double get percentage => maxGrade > 0 ? (grade / maxGrade) * 100 : 0;

  double get weightedGrade => (percentage * weight) / 100;

  @override
  List<Object?> get props => [name, nameAr, grade, maxGrade, weight];
}
