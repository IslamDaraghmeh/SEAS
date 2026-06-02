import 'package:equatable/equatable.dart';

/// Exam Status Enum
enum ExamStatus {
  upcoming,
  ongoing,
  completed,
  cancelled;

  static ExamStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'upcoming':
      case 'scheduled':
        return ExamStatus.upcoming;
      case 'ongoing':
      case 'in_progress':
        return ExamStatus.ongoing;
      case 'completed':
      case 'finished':
        return ExamStatus.completed;
      case 'cancelled':
      case 'canceled':
        return ExamStatus.cancelled;
      default:
        return ExamStatus.upcoming;
    }
  }

  String toArabic() {
    switch (this) {
      case ExamStatus.upcoming:
        return 'قادم';
      case ExamStatus.ongoing:
        return 'جاري';
      case ExamStatus.completed:
        return 'مكتمل';
      case ExamStatus.cancelled:
        return 'ملغي';
    }
  }

  String toEnglish() {
    switch (this) {
      case ExamStatus.upcoming:
        return 'Upcoming';
      case ExamStatus.ongoing:
        return 'Ongoing';
      case ExamStatus.completed:
        return 'Completed';
      case ExamStatus.cancelled:
        return 'Cancelled';
    }
  }
}

/// Exam Type Enum
enum ExamType {
  midterm,
  finalExam,
  quiz,
  practical,
  oral;

  static ExamType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'midterm':
      case 'mid':
        return ExamType.midterm;
      case 'final':
      case 'final_exam':
        return ExamType.finalExam;
      case 'quiz':
        return ExamType.quiz;
      case 'practical':
      case 'lab':
        return ExamType.practical;
      case 'oral':
        return ExamType.oral;
      default:
        return ExamType.midterm;
    }
  }

  String toArabic() {
    switch (this) {
      case ExamType.midterm:
        return 'اختبار نصفي';
      case ExamType.finalExam:
        return 'اختبار نهائي';
      case ExamType.quiz:
        return 'اختبار قصير';
      case ExamType.practical:
        return 'اختبار عملي';
      case ExamType.oral:
        return 'اختبار شفهي';
    }
  }

  String toEnglish() {
    switch (this) {
      case ExamType.midterm:
        return 'Midterm';
      case ExamType.finalExam:
        return 'Final';
      case ExamType.quiz:
        return 'Quiz';
      case ExamType.practical:
        return 'Practical';
      case ExamType.oral:
        return 'Oral';
    }
  }
}

/// Exam Model
class ExamModel extends Equatable {
  final String id;
  final String courseId;
  final String courseName;
  final String? courseNameAr;
  final String courseCode;
  final ExamType type;
  final ExamStatus status;
  final DateTime examDate;
  final DateTime startTime;
  final DateTime endTime;
  final int durationMinutes;
  final String? location;
  final String? locationAr;
  final String? building;
  final String? room;
  final double maxGrade;
  final String? instructions;
  final String? instructionsAr;
  final bool isAttendanceMarked;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ExamModel({
    required this.id,
    required this.courseId,
    required this.courseName,
    this.courseNameAr,
    required this.courseCode,
    required this.type,
    required this.status,
    required this.examDate,
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    this.location,
    this.locationAr,
    this.building,
    this.room,
    this.maxGrade = 100,
    this.instructions,
    this.instructionsAr,
    this.isAttendanceMarked = false,
    this.createdAt,
    this.updatedAt,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    return ExamModel(
      id: json['id']?.toString() ?? '',
      courseId: json['course_id']?.toString() ?? json['courseId']?.toString() ?? '',
      courseName: json['course_name'] ?? json['courseName'] ?? '',
      courseNameAr: json['course_name_ar'] ?? json['courseNameAr'],
      courseCode: json['course_code'] ?? json['courseCode'] ?? '',
      type: ExamType.fromString(json['type'] ?? 'midterm'),
      status: ExamStatus.fromString(json['status'] ?? 'upcoming'),
      examDate: DateTime.tryParse(json['exam_date'] ?? json['examDate'] ?? '') ??
          DateTime.now(),
      startTime: DateTime.tryParse(json['start_time'] ?? json['startTime'] ?? '') ??
          DateTime.now(),
      endTime: DateTime.tryParse(json['end_time'] ?? json['endTime'] ?? '') ??
          DateTime.now(),
      durationMinutes: json['duration_minutes'] ?? json['durationMinutes'] ?? 60,
      location: json['location'],
      locationAr: json['location_ar'] ?? json['locationAr'],
      building: json['building'],
      room: json['room'],
      maxGrade: (json['max_grade'] ?? json['maxGrade'] ?? 100).toDouble(),
      instructions: json['instructions'],
      instructionsAr: json['instructions_ar'] ?? json['instructionsAr'],
      isAttendanceMarked:
          json['is_attendance_marked'] ?? json['isAttendanceMarked'] ?? false,
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
      'course_id': courseId,
      'course_name': courseName,
      'course_name_ar': courseNameAr,
      'course_code': courseCode,
      'type': type.name,
      'status': status.name,
      'exam_date': examDate.toIso8601String(),
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'duration_minutes': durationMinutes,
      'location': location,
      'location_ar': locationAr,
      'building': building,
      'room': room,
      'max_grade': maxGrade,
      'instructions': instructions,
      'instructions_ar': instructionsAr,
      'is_attendance_marked': isAttendanceMarked,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  ExamModel copyWith({
    String? id,
    String? courseId,
    String? courseName,
    String? courseNameAr,
    String? courseCode,
    ExamType? type,
    ExamStatus? status,
    DateTime? examDate,
    DateTime? startTime,
    DateTime? endTime,
    int? durationMinutes,
    String? location,
    String? locationAr,
    String? building,
    String? room,
    double? maxGrade,
    String? instructions,
    String? instructionsAr,
    bool? isAttendanceMarked,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ExamModel(
      id: id ?? this.id,
      courseId: courseId ?? this.courseId,
      courseName: courseName ?? this.courseName,
      courseNameAr: courseNameAr ?? this.courseNameAr,
      courseCode: courseCode ?? this.courseCode,
      type: type ?? this.type,
      status: status ?? this.status,
      examDate: examDate ?? this.examDate,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      location: location ?? this.location,
      locationAr: locationAr ?? this.locationAr,
      building: building ?? this.building,
      room: room ?? this.room,
      maxGrade: maxGrade ?? this.maxGrade,
      instructions: instructions ?? this.instructions,
      instructionsAr: instructionsAr ?? this.instructionsAr,
      isAttendanceMarked: isAttendanceMarked ?? this.isAttendanceMarked,
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

  /// Get location based on locale
  String? getLocation(String locale) {
    if (locale == 'ar' && locationAr != null && locationAr!.isNotEmpty) {
      return locationAr;
    }
    return location;
  }

  /// Get instructions based on locale
  String? getInstructions(String locale) {
    if (locale == 'ar' && instructionsAr != null && instructionsAr!.isNotEmpty) {
      return instructionsAr;
    }
    return instructions;
  }

  /// Get full location string
  String get fullLocation {
    final parts = <String>[];
    if (building != null && building!.isNotEmpty) parts.add(building!);
    if (room != null && room!.isNotEmpty) parts.add(room!);
    if (location != null && location!.isNotEmpty) parts.add(location!);
    return parts.join(' - ');
  }

  /// Check if exam is today
  bool get isToday {
    final now = DateTime.now();
    return examDate.year == now.year &&
        examDate.month == now.month &&
        examDate.day == now.day;
  }

  /// Check if exam is upcoming
  bool get isUpcoming => status == ExamStatus.upcoming;

  /// Get days until exam
  int get daysUntil {
    final now = DateTime.now();
    return examDate.difference(now).inDays;
  }

  @override
  List<Object?> get props => [
        id,
        courseId,
        courseName,
        courseNameAr,
        courseCode,
        type,
        status,
        examDate,
        startTime,
        endTime,
        durationMinutes,
        location,
        locationAr,
        building,
        room,
        maxGrade,
        instructions,
        instructionsAr,
        isAttendanceMarked,
        createdAt,
        updatedAt,
      ];
}
