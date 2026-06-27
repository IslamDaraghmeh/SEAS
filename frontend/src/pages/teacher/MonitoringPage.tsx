import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EyeIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  BellIcon,
  ClockIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { PageLoading, SkeletonCard } from '../../components/ui/Loading';
import examService, { Exam } from '../../services/exam.service';
import verificationService, { VerificationLog } from '../../services/verification.service';
import { monitoringSocket, StudentStatus, ExamMonitoringData, VerificationResult } from '../../services/monitoring.socket';
import LiveCameraGrid from '../../components/monitoring/LiveCameraGrid';
import StudentMonitoringModal from '../../components/monitoring/StudentMonitoringModal';
import VerificationAlertPanel from '../../components/monitoring/VerificationAlertPanel';
import { useAuth } from '../../hooks/useAuth';
import { format, isValid, Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Helper function to safely format dates
const formatDate = (dateValue: string | Date | null | undefined, formatStr: string, locale: Locale): string => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (!isValid(date)) return '-';
  return format(date, formatStr, { locale });
};

type TabType = 'cameras' | 'verifications' | 'alerts' | 'logs';

const MonitoringPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { examId } = useParams<{ examId: string }>();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language === 'ar' ? ar : enUS;

  const [selectedExam, setSelectedExam] = useState<string>(examId || '');
  const [activeTab, setActiveTab] = useState<TabType>('cameras');
  const [alertFilter, setAlertFilter] = useState<'all' | 'alerts'>('all');
  const [isConnected, setIsConnected] = useState(false);
  const [monitoringData, setMonitoringData] = useState<ExamMonitoringData | null>(null);
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [recentVerifications, setRecentVerifications] = useState<VerificationResult[]>([]);

  // Fetch teacher's exams (ACTIVE and PUBLISHED - both can be monitored)
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['teacherExams', 'monitoring'],
    queryFn: async () => {
      // Fetch both active and published exams for monitoring
      const [activeExams, publishedExams] = await Promise.all([
        examService.getTeacherExams({ status: 'ACTIVE' }),
        examService.getTeacherExams({ status: 'PUBLISHED' }),
      ]);
      return {
        data: [...(activeExams.data || []), ...(publishedExams.data || [])],
      };
    },
  });

  // Fetch verification logs (fallback polling)
  const { data: logsData, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['verificationLogs', selectedExam, alertFilter],
    queryFn: () =>
      verificationService.getExamVerificationLogs(selectedExam, {
        alertsOnly: alertFilter === 'alerts',
        limit: 50,
      }),
    enabled: !!selectedExam,
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  // Fetch flagged students
  const { data: flaggedStudents, refetch: refetchFlagged } = useQuery({
    queryKey: ['flaggedStudents', selectedExam],
    queryFn: () => verificationService.getFlaggedStudents(selectedExam),
    enabled: !!selectedExam,
  });

  const exams = examsData?.data || [];
  const logs = logsData?.logs || [];

  // Connect to WebSocket when exam is selected
  useEffect(() => {
    if (!selectedExam || !token) return;

    const connectAndJoin = async () => {
      try {
        console.log('Connecting to monitoring socket...');
        await monitoringSocket.connect(token);
        setIsConnected(true);
        console.log('Socket connected, joining exam room:', selectedExam);

        const data = await monitoringSocket.joinExamRoom(selectedExam);
        console.log('Join exam room response:', data);

        if (data) {
          setMonitoringData(data);
          setStudents(data.students || []);
          console.log('Monitoring data loaded:', data.examTitle, 'Students:', data.students?.length || 0);
          // Show success message
          if (data.students?.length === 0) {
            toast.success(t('monitoring.connectedWaiting') || 'Connected. Waiting for students to join...');
          } else {
            toast.success(t('monitoring.connectedWithStudents') || `Connected. ${data.students?.length} student(s) in exam.`);
          }
        } else {
          console.warn('No data returned from joinExamRoom - this may be a timeout or permission issue');
          // Don't show error if socket is still connected - the join might have succeeded on server side
          if (monitoringSocket.isConnected()) {
            toast.error(t('monitoring.joinFailed') || 'Could not join exam room. Please refresh the page.');
          } else {
            toast.error(t('monitoring.connectionFailed') || 'Failed to connect to live monitoring');
          }
        }
      } catch (error: any) {
        console.error('Failed to connect to monitoring:', error);
        const errorMessage = error?.message || t('monitoring.connectionFailed') || 'Failed to connect to live monitoring';
        toast.error(errorMessage);
        setIsConnected(false);
      }
    };

    connectAndJoin();

    return () => {
      monitoringSocket.leaveExamRoom();
    };
  }, [selectedExam, token, t]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Student online/offline updates
    unsubscribers.push(
      monitoringSocket.onStudentOnline(async ({ attemptId }) => {
        // Check if this student already exists in our list
        setStudents(prev => {
          const existingStudent = prev.find(s => s.attemptId === attemptId);
          if (existingStudent) {
            // Update existing student's online status
            return prev.map(s =>
              s.attemptId === attemptId ? { ...s, isOnline: true } : s
            );
          }
          // Student not in list - need to fetch updated data
          return prev;
        });

        // Fetch updated monitoring data to get the new student
        const updatedData = await monitoringSocket.requestMonitoringUpdate();
        if (updatedData) {
          setMonitoringData(updatedData);
          setStudents(updatedData.students || []);
        }
      })
    );

    unsubscribers.push(
      monitoringSocket.onStudentOffline(({ attemptId }) => {
        setStudents(prev =>
          prev.map(s =>
            s.attemptId === attemptId ? { ...s, isOnline: false } : s
          )
        );
      })
    );

    // Verification updates
    unsubscribers.push(
      monitoringSocket.onVerificationUpdate((data) => {
        setStudents(prev =>
          prev.map(s =>
            s.attemptId === data.attemptId
              ? {
                  ...s,
                  lastVerification: {
                    isVerified: data.isVerified,
                    matchScore: data.matchScore,
                    timestamp: data.timestamp,
                  },
                }
              : s
          )
        );
        // Refresh logs
        refetch();
      })
    );

    // New alerts
    unsubscribers.push(
      monitoringSocket.onAlertCreated((data) => {
        setStudents(prev =>
          prev.map(s =>
            s.attemptId === data.attemptId
              ? {
                  ...s,
                  alertCount: s.alertCount + 1,
                  unresolvedAlerts: s.unresolvedAlerts + 1,
                }
              : s
          )
        );

        // Show toast notification
        toast.error(`${t('monitoring.alerts')}: ${data.message}`, {
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
        });

        refetch();
      })
    );

    // Student flagged
    unsubscribers.push(
      monitoringSocket.onStudentFlagged((data) => {
        toast.success(
          t('monitoring.studentFlaggedBy') || `Student flagged by ${data.flaggedBy}`
        );
        refetchFlagged();
      })
    );

    // Exam update (full refresh)
    unsubscribers.push(
      monitoringSocket.onExamUpdate((data) => {
        setMonitoringData(data);
        setStudents(data.students);
      })
    );

    // Verification results (all verifications - success and failed)
    unsubscribers.push(
      monitoringSocket.onVerificationResult((data) => {
        // Add to recent verifications list
        setRecentVerifications(prev => [data, ...prev].slice(0, 20));

        // Show toast for failed verifications
        if (data.type === 'failed') {
          toast.error(
            `${t('verification.verificationFailed')}: ${data.studentName} (${Math.round(data.matchScore * 100)}%)`,
            {
              icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
              duration: 5000,
            }
          );
        }
      })
    );

    // Verification alerts (failed verifications needing review)
    unsubscribers.push(
      monitoringSocket.onVerificationAlert(() => {
        setPendingVerifications(prev => prev + 1);
      })
    );

    // Manual verification updates
    unsubscribers.push(
      monitoringSocket.onManualVerification(() => {
        setPendingVerifications(prev => Math.max(0, prev - 1));
        refetch();
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, refetch, refetchFlagged, t]);

  // Set selected exam from URL param
  useEffect(() => {
    if (examId) {
      setSelectedExam(examId);
    }
  }, [examId]);

  // Handle verification request
  const handleRequestVerification = useCallback(async (attemptId: string) => {
    const success = await monitoringSocket.requestVerification(attemptId);
    if (success) {
      toast.success(t('monitoring.verificationRequested') || 'Verification requested');
    } else {
      toast.error(t('common.error') || 'Failed to request verification');
    }
  }, [t]);

  // Handle flag student
  const handleFlagStudent = useCallback(async (attemptId: string, reason: string) => {
    const success = await monitoringSocket.flagStudent(attemptId, reason);
    if (success) {
      toast.success(t('monitoring.studentFlagged') || 'Student flagged');
      refetchFlagged();
    } else {
      toast.error(t('common.error') || 'Failed to flag student');
    }
  }, [refetchFlagged, t]);

  // Exam options for dropdown
  const examOptions = exams.map((exam: Exam) => ({
    value: exam.id,
    label: exam.title,
  }));

  // Alert type styles
  const alertTypeStyles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    face_not_detected: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ExclamationTriangleIcon },
    multiple_faces: { bg: 'bg-red-100', text: 'text-red-700', icon: ExclamationTriangleIcon },
    different_person: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon },
    poor_quality: { bg: 'bg-gray-100', text: 'text-gray-700', icon: VideoCameraIcon },
  };

  if (examsLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('monitoring.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('monitoring.liveMonitoring')}
            {isConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {t('monitoring.connected') || 'Connected'}
              </span>
            )}
          </p>
        </div>
        <div className="w-64">
          <Select
            options={[{ value: '', label: t('exam.selectAnswer') }, ...examOptions]}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          />
        </div>
      </div>

      {!selectedExam ? (
        <Card>
          <div className="text-center py-12">
            <EyeIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('exam.selectAnswer')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{t('monitoring.liveMonitoring')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title={t('monitoring.activeStudents') || 'Active Students'}
              value={monitoringData?.activeStudents || students.filter(s => s.isOnline).length}
              icon={<UserIcon className="h-6 w-6" />}
            />
            <StatCard
              title={t('monitoring.alerts')}
              value={monitoringData?.unresolvedAlerts || students.reduce((sum, s) => sum + s.unresolvedAlerts, 0)}
              icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            />
            <StatCard
              title={t('monitoring.flagged')}
              value={flaggedStudents?.length || 0}
              icon={<XCircleIcon className="h-6 w-6" />}
            />
            <StatCard
              title={t('verification.verified')}
              value={students.filter(s => s.lastVerification?.isVerified).length}
              icon={<CheckCircleIcon className="h-6 w-6" />}
            />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('cameras')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'cameras'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <VideoCameraIcon className="h-5 w-5 inline-block me-2" />
                {t('monitoring.liveCameras') || 'Live Cameras'}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                  {students.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('verifications')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'verifications'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5 inline-block me-2" />
                {t('verification.verifications') || 'Verifications'}
                {pendingVerifications > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded text-xs animate-pulse">
                    {pendingVerifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'alerts'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <BellIcon className="h-5 w-5 inline-block me-2" />
                {t('monitoring.alerts')}
                {(monitoringData?.unresolvedAlerts || 0) > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded text-xs">
                    {monitoringData?.unresolvedAlerts}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'logs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ClockIcon className="h-5 w-5 inline-block me-2" />
                {t('monitoring.activityLog') || 'Activity Log'}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'cameras' && (
              <LiveCameraGrid
                students={students}
                onRequestVerification={handleRequestVerification}
                onFlagStudent={handleFlagStudent}
                onSelectStudent={setSelectedStudent}
              />
            )}

            {activeTab === 'verifications' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Verification Alerts Panel */}
                <div className="lg:col-span-2">
                  <Card>
                    <VerificationAlertPanel
                      examId={selectedExam}
                      isConnected={isConnected}
                    />
                  </Card>
                </div>

                {/* Recent Verifications */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('verification.recentVerifications') || 'Recent Verifications'}</CardTitle>
                    </CardHeader>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {recentVerifications.length > 0 ? (
                        recentVerifications.map((v, index) => (
                          <div
                            key={`${v.verificationId}-${index}`}
                            className={`p-3 rounded-lg border ${
                              v.isVerified
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {v.studentName}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  v.isVerified
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {Math.round(v.matchScore * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {v.studentNumber} • {formatDate(v.timestamp, 'HH:mm:ss', locale)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <ShieldCheckIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">{t('verification.noRecentVerifications') || 'No recent verifications'}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Flagged Students */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('monitoring.flagged')}</CardTitle>
                    </CardHeader>

                    {flaggedStudents && flaggedStudents.length > 0 ? (
                      <div className="space-y-3">
                        {flaggedStudents.map((student) => (
                          <div
                            key={student.studentId}
                            className="p-4 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-full">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {student.studentName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {student.studentId}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-medium rounded">
                                {student.alertCount} {t('monitoring.alerts')}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-red-600">{student.reason}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDate(student.flaggedAt, 'PPp', locale)}
                              </span>
                              <Button variant="outline" size="sm">
                                {t('common.view')}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>{t('monitoring.noSuspiciousActivity')}</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Quick Stats */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('monitoring.alerts')}</CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {t('common.total') || 'Total Alerts'}
                        </span>
                        <span className="font-medium text-gray-900">
                          {monitoringData?.totalAlerts || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-red-600">
                          {t('common.pending') || 'Unresolved'}
                        </span>
                        <span className="font-medium text-red-700">
                          {monitoringData?.unresolvedAlerts || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-600">
                          {t('monitoring.cleared') || 'Resolved'}
                        </span>
                        <span className="font-medium text-green-700">
                          {(monitoringData?.totalAlerts || 0) - (monitoringData?.unresolvedAlerts || 0)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <Card>
                <CardHeader
                  action={
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        {t('common.refresh')}
                      </Button>
                      <Select
                        options={[
                          { value: 'all', label: t('common.all') || 'All' },
                          { value: 'alerts', label: t('monitoring.alerts') },
                        ]}
                        value={alertFilter}
                        onChange={(e) => setAlertFilter(e.target.value as 'all' | 'alerts')}
                        fullWidth={false}
                      />
                    </div>
                  }
                >
                  <CardTitle>{t('monitoring.verificationLogs')}</CardTitle>
                </CardHeader>

                {logsLoading ? (
                  <div className="space-y-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : logs.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {logs.map((log: VerificationLog) => {
                      const alertStyle = log.alertType
                        ? alertTypeStyles[log.alertType]
                        : null;
                      const AlertIcon = alertStyle?.icon || CheckCircleIcon;

                      return (
                        <div
                          key={log.id}
                          className={`p-4 rounded-lg border ${
                            log.verified
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  log.verified ? 'bg-green-100' : 'bg-red-100'
                                }`}
                              >
                                {log.verified ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                  <AlertIcon className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {log.studentId}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(log.timestamp, 'PPp', locale)}
                                </p>
                                {log.alertType && (
                                  <span
                                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${alertStyle?.bg} ${alertStyle?.text}`}
                                  >
                                    {t(`monitoring.${log.alertType.replace('_', '')}`)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-end">
                              <span
                                className={`text-sm font-medium ${
                                  log.verified ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {Math.round(log.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <EyeIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{t('monitoring.noSuspiciousActivity')}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </>
      )}

      {/* Student Detail Modal */}
      <StudentMonitoringModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onRequestVerification={handleRequestVerification}
        onFlagStudent={handleFlagStudent}
      />
    </div>
  );
};

export default MonitoringPage;
