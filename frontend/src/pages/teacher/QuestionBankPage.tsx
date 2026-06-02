import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  FolderIcon,
  TrashIcon,
  PencilIcon,
  TagIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { questionBankService, QuestionBank, QuestionTag, Question } from '../../services/question-bank.service';
import toast from 'react-hot-toast';

const QuestionBankPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Array<{ question: Question }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  // Form state
  const [bankForm, setBankForm] = useState({
    titleAr: '',
    titleEn: '',
    description: '',
    courseId: '',
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadBanks();
    loadTags();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      loadQuestions(selectedBank.id);
    }
  }, [selectedBank, selectedTags]);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const data = await questionBankService.getAll();
      setBanks(data);
    } catch (error) {
      toast.error(t('errors.loadFailed') || 'Failed to load question banks');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const data = await questionBankService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadQuestions = async (bankId: string) => {
    try {
      const data = await questionBankService.getQuestions(bankId, selectedTags);
      setQuestions(data);
    } catch (error) {
      toast.error(t('errors.loadFailed') || 'Failed to load questions');
    }
  };

  const handleCreateBank = async () => {
    try {
      const bank = await questionBankService.create(bankForm);
      setBanks([bank, ...banks]);
      setShowCreateModal(false);
      setBankForm({ titleAr: '', titleEn: '', description: '', courseId: '' });
      toast.success(t('common.created') || 'Created successfully');
    } catch (error) {
      toast.error(t('errors.createFailed') || 'Failed to create');
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm(t('common.confirmDelete') || 'Are you sure?')) return;
    try {
      await questionBankService.delete(id);
      setBanks(banks.filter((b) => b.id !== id));
      if (selectedBank?.id === id) {
        setSelectedBank(null);
        setQuestions([]);
      }
      toast.success(t('common.deleted') || 'Deleted successfully');
    } catch (error) {
      toast.error(t('errors.deleteFailed') || 'Failed to delete');
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!selectedBank) return;
    try {
      await questionBankService.removeQuestion(selectedBank.id, questionId);
      setQuestions(questions.filter((q) => q.question.id !== questionId));
      toast.success(t('common.removed') || 'Removed successfully');
    } catch (error) {
      toast.error(t('errors.removeFailed') || 'Failed to remove');
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return;
    try {
      const tag = await questionBankService.createTag(newTag.trim());
      setTags([...tags, tag]);
      setNewTag('');
      setShowTagModal(false);
      toast.success(t('common.created') || 'Created successfully');
    } catch (error) {
      toast.error(t('errors.createFailed') || 'Failed to create tag');
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const filteredQuestions = questions.filter((item) => {
    if (!searchTerm) return true;
    const q = item.question;
    const term = searchTerm.toLowerCase();
    return (
      q.textAr.toLowerCase().includes(term) ||
      q.textEn.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('questionBank.title') || 'Question Banks'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTagModal(true)}>
            <TagIcon className="h-4 w-4 mr-2" />
            {t('questionBank.manageTags') || 'Manage Tags'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('questionBank.create') || 'Create Bank'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banks List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-800 mb-4">
              {t('questionBank.banks') || 'Question Banks'}
            </h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                {t('common.loading') || 'Loading...'}
              </div>
            ) : banks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('questionBank.noBanks') || 'No question banks yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedBank?.id === bank.id
                        ? 'bg-primary-100 border-primary-500 border'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                    onClick={() => setSelectedBank(bank)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-5 w-5 text-primary-600" />
                        <span className="font-medium">
                          {isRTL ? bank.titleAr : bank.titleEn}
                        </span>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{bank._count?.questions || 0} {t('questions.questions') || 'questions'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBank(bank.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tags Filter */}
          <Card className="p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              {t('questionBank.filterByTags') || 'Filter by Tags'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                  {tag._count?.questions ? ` (${tag._count.questions})` : ''}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Questions List */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            {selectedBank ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">
                    {isRTL ? selectedBank.titleAr : selectedBank.titleEn}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuestionModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      {t('questions.add') || 'Add Question'}
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('common.search') || 'Search questions...'}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Questions */}
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t('questionBank.noQuestions') || 'No questions in this bank'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((item) => (
                      <div
                        key={item.question.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="inline-block px-2 py-0.5 text-xs rounded bg-primary-100 text-primary-700 mb-2">
                              {item.question.type.replace('_', ' ')}
                            </span>
                            <p className="text-gray-800">
                              {isRTL ? item.question.textAr : item.question.textEn}
                            </p>
                            {item.question.tags && item.question.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {item.question.tags.map((t) => (
                                  <span
                                    key={t.tag.id}
                                    className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded"
                                  >
                                    {t.tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleRemoveQuestion(item.question.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        {item.question.options && item.question.options.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            {item.question.options.map((opt, idx) => (
                              <div
                                key={idx}
                                className={`text-sm ${
                                  opt.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}. {isRTL ? opt.textAr : opt.textEn}
                                {opt.isCorrect && ' ✓'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {t('questionBank.selectBank') || 'Select a question bank to view questions'}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create Bank Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('questionBank.createBank') || 'Create Question Bank'}
      >
        <div className="space-y-4">
          <Input
            label={t('questionBank.titleAr') || 'Title (Arabic)'}
            value={bankForm.titleAr}
            onChange={(e) => setBankForm({ ...bankForm, titleAr: e.target.value })}
          />
          <Input
            label={t('questionBank.titleEn') || 'Title (English)'}
            value={bankForm.titleEn}
            onChange={(e) => setBankForm({ ...bankForm, titleEn: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('questionBank.description') || 'Description'}
            </label>
            <textarea
              value={bankForm.description}
              onChange={(e) => setBankForm({ ...bankForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleCreateBank}>
              {t('common.create') || 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Tag Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title={t('questionBank.manageTags') || 'Manage Tags'}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder={t('questionBank.newTagName') || 'New tag name'}
              className="flex-1"
            />
            <Button onClick={handleCreateTag}>
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionBankPage;
