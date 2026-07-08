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
      case 'published': // backend: published and waiting to start
      case 'draft':
        return ExamStatus.upcoming;
      case 'ongoing':
      case 'in_progress':
      case 'active': // backend: exam window currently open
        return ExamStatus.ongoing;
      case 'completed':
      case 'finished':
      case 'graded':
      case 'closed':
      case 'archived':
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
    // The SEAS backend returns a nested shape:
    //   { id, courseId, titleEn/titleAr, scheduledAt, endTime, durationMinutes,
    //     totalPoints, status: PUBLISHED|ACTIVE|..., instructionsEn/Ar,
    //     course: { codeEn, codeAr, nameEn, nameAr } }
    // We parse that here while keeping fallbacks to the older flat snake_case
    // keys so nothing else breaks.
    final course = json['course'] is Map<String, dynamic>
        ? json['course'] as Map<String, dynamic>
        : const <String, dynamic>{};

    final titleEn = json['titleEn'] ?? json['title_en'];
    final titleAr = json['titleAr'] ?? json['title_ar'];

    // The exam's own title (e.g. "Midterm Exam", "quiz #1") is the most useful
    // label; fall back to the course name if a title isn't present.
    final courseNameEn = titleEn ??
        course['nameEn'] ??
        json['course_name'] ??
        json['courseName'] ??
        course['nameAr'] ??
        '';
    final courseNameArabic = titleAr ??
        course['nameAr'] ??
        json['course_name_ar'] ??
        json['courseNameAr'];

    // Prefer an explicit start/schedule time; derive the end time from the
    // duration when the backend doesn't send one.
    final start = DateTime.tryParse(
          json['scheduledAt'] ??
              json['start_time'] ??
              json['startTime'] ??
              json['exam_date'] ??
              json['examDate'] ??
              '',
        ) ??
        DateTime.now();
    final duration =
        (json['durationMinutes'] ?? json['duration_minutes'] ?? 60) as int;
    final end = DateTime.tryParse(json['endTime'] ?? json['end_time'] ?? '') ??
        start.add(Duration(minutes: duration));

    return ExamModel(
      id: json['id']?.toString() ?? '',
      courseId: json['courseId']?.toString() ?? json['course_id']?.toString() ?? '',
      courseName: courseNameEn,
      courseNameAr: courseNameArabic,
      courseCode: course['codeEn'] ??
          course['codeAr'] ??
          json['course_code'] ??
          json['courseCode'] ??
          '',
      type: ExamType.fromString(
        json['type'] ?? _inferType(titleEn ?? titleAr ?? ''),
      ),
      status: ExamStatus.fromString(json['status']?.toString() ?? 'upcoming'),
      examDate: start,
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      location: json['location'],
      locationAr: json['location_ar'] ?? json['locationAr'],
      building: json['building'],
      room: json['room'],
      maxGrade:
          (json['totalPoints'] ?? json['max_grade'] ?? json['maxGrade'] ?? 100)
              .toDouble(),
      instructions: json['instructionsEn'] ?? json['instructions'],
      instructionsAr: json['instructionsAr'] ??
          json['instructions_ar'] ??
          json['instructionsAr'],
      isAttendanceMarked:
          json['is_attendance_marked'] ?? json['isAttendanceMarked'] ?? false,
      createdAt: DateTime.tryParse(
          json['createdAt'] ?? json['created_at'] ?? ''),
      updatedAt: DateTime.tryParse(
          json['updatedAt'] ?? json['updated_at'] ?? ''),
    );
  }

  /// Best-effort exam type from the title, since the backend has no type field.
  static String _inferType(String title) {
    final t = title.toLowerCase();
    if (t.contains('quiz')) return 'quiz';
    if (t.contains('final') || t.contains('نهائي')) return 'final';
    if (t.contains('practical') || t.contains('عملي')) return 'practical';
    if (t.contains('oral') || t.contains('شفهي')) return 'oral';
    return 'midterm';
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
