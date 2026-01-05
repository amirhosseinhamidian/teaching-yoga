// components/Subscription/SubscriptionsAdminClient.jsx
'use client';

import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import TextArea from '@/components/Ui/TextArea/TextArea';
import { useState } from 'react';
import React from 'react';
import { BiTrash } from 'react-icons/bi';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '@/components/modules/Modal/Modal';
import { LuPencil, LuTrash } from 'react-icons/lu';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { IoClose } from 'react-icons/io5';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  discountAmount: '',
  durationInDays: '',
  intervalLabel: '',
  isActive: true,
  courseIds: [],
  features: [],
};

const SubscriptionsAdminClient = ({ plans: initialPlans, courses }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [plans, setPlans] = useState(initialPlans || []);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTempId, setDeleteTempId] = useState(null);

  const [errorMessages, setErrorMessages] = useState({
    name: '',
    description: '',
    features: '',
    price: '',
    discountAmount: '',
    durationInDays: '',
    intervalLabel: '',
  });

  const validateInputs = () => {
    const errors = {};

    // نام پلن (اجباری)
    if (!form.name || !form.name.trim()) {
      errors.name = 'نام پلن اجباری است.';
    }

    // توضیحات پلن (اگر می‌خوای اختیاری باشه، این بلوک رو بردار)
    if (!form.description || !form.description.trim()) {
      errors.description = 'توضیحات پلن را بنویسید.';
    }

    // قیمت پایه (اجباری + عدد معتبر و مثبت)
    if (!form.price || !String(form.price).trim()) {
      errors.price = 'مبلغ پایه اجباری است.';
    } else {
      const priceNumber = Number(form.price);

      if (Number.isNaN(priceNumber) || priceNumber <= 0) {
        errors.price = 'مبلغ معتبر وارد کنید.';
      }
    }

    // مبلغ تخفیف (اختیاری؛ فقط اگر چیزی وارد شده، چک شود)
    if (form.discountAmount !== '' && form.discountAmount != null) {
      const discountNumber = Number(form.discountAmount);

      if (Number.isNaN(discountNumber) || discountNumber < 0) {
        errors.discountAmount = 'مبلغ تخفیف معتبر وارد کنید.';
      }
    }

    // مدت اشتراک (اجباری + عدد معتبر و مثبت)
    if (!form.durationInDays || !String(form.durationInDays).trim()) {
      errors.durationInDays = 'مدت اشتراک اجباری است.';
    } else {
      const durationNumber = Number(form.durationInDays);

      if (Number.isNaN(durationNumber) || durationNumber <= 0) {
        errors.durationInDays = 'مدت اشتراک معتبر وارد کنید.';
      }
    }

    // لیبل بازه (اجباری)
    if (!form.intervalLabel || !form.intervalLabel.trim()) {
      errors.intervalLabel = 'لیبل اجباری است.';
    }

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFeatureChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.features];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, features: updated };
    });
  };

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...(prev.features || []), { label: '', value: '' }],
    }));
  };

  const removeFeature = (index) => {
    setForm((prev) => {
      const updated = [...prev.features];
      updated.splice(index, 1);
      return { ...prev, features: updated };
    });
  };

  const handleAddCourse = (courseId) => {
    const id = Number(courseId);
    if (!id) return;

    setForm((prev) => {
      if (prev.courseIds.includes(id)) return prev; // اگر قبلاً اضافه شده، تکراری نشه
      return { ...prev, courseIds: [...prev.courseIds, id] };
    });

    setSelectedCourseId(null); // بعد از انتخاب، دراپ‌دان رو خالی کن
  };

  const handleRemoveCourse = (courseId) => {
    setForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.filter((id) => id !== courseId),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    console.log(field, value);
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);

    setForm({
      name: plan.name || '',
      description: plan.description || '',
      // ورودی‌ها معمولاً رشته می‌خوان
      price:
        typeof plan.price === 'number'
          ? plan.price.toString()
          : plan.price || '',

      discountAmount:
        typeof plan.discountAmount === 'number'
          ? plan.discountAmount.toString()
          : (plan.discountAmount ?? ''),

      durationInDays:
        typeof plan.durationInDays === 'number'
          ? plan.durationInDays.toString()
          : (plan.durationInDays ?? ''),

      // 👇 این همونیه که باید از پلن بخونی، نه interval قدیمی
      intervalLabel: plan.intervalLabel || '',

      isActive: plan.isActive,

      courseIds: (plan.planCourses || []).map((pc) => pc.courseId),

      // 👇 features از نوع Json هست؛ فرض می‌کنیم آرایه‌ای از {label, value} باشه
      features: Array.isArray(plan.features)
        ? plan.features.map((f) => ({
            label: f.label || '',
            value: f.value || '',
          }))
        : [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      toast.showErrorToast('مقادیر فرم صحیح نیست.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name,
        description: form.description,
        features: form.features,
        price: Number(form.price),
        discountAmount: form.discountAmount ? Number(form.discountAmount) : 0,
        durationInDays: Number(form.durationInDays),
        intervalLabel: form.intervalLabel,
        isActive: form.isActive,
        courseIds: form.courseIds,
      };

      const url = editingId
        ? `/api/admin/subscription/plans/${editingId}`
        : '/api/admin/subscription/plans';

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[SUBSCRIPTION_PLAN_SAVE_ERROR]', data);
        toast.showErrorToast(data?.error || 'خطا در ذخیره پلن اشتراک');
        return;
      }

      if (editingId) {
        setPlans((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      } else {
        setPlans((prev) => [data, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error('[SUBSCRIPTION_PLAN_SAVE_EXCEPTION]', err);
      toast.showErrorToast('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteModal = (id) => {
    setDeleteTempId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/subscription/plans/${deleteTempId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[SUBSCRIPTION_PLAN_DELETE_ERROR]', data);
        toast.showErrorToast(data?.error || 'خطا در حذف پلن');
        return;
      }

      setPlans((prev) => prev.filter((p) => p.id !== deleteTempId));

      if (editingId === deleteTempId) {
        resetForm();
      }
    } catch (err) {
      console.error('[SUBSCRIPTION_PLAN_DELETE_EXCEPTION]', err);
      toast.showErrorToast('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteTempId(null);
    }
  };

  return (
    <div className='mb-96 grid gap-6 lg:grid-cols-[2fr,1.5fr]'>
      {/* فرم ساخت/ویرایش پلن */}
      <div className='rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark'>
        <h2 className='mb-3 font-semibold'>
          {editingId ? 'ویرایش پلن اشتراک' : 'ایجاد پلن جدید'}
        </h2>

        <form onSubmit={handleSubmit} className='space-y-3'>
          <div>
            <label className='mb-1 block text-xs font-medium'>نام پلن</label>
            <Input
              type='text'
              value={form.name}
              onChange={(value) => handleChange('name', value)}
              fullWidth
              placeholder='نام پلن را وارد کنید'
              className='text-sm'
              required
              errorMessage={errorMessages.name}
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-medium'>توضیحات</label>
            <TextArea
              value={form.description}
              onChange={(value) => handleChange('description', value)}
              fullWidth
              placeholder='توضیحات پلن را بنویسید'
              className='text-sm'
              errorMessage={errorMessages.description}
            />
          </div>

          <div>
            <label className='mb-3 block text-xs font-medium'>
              توضیحات موردی (کلید–مقدار)
            </label>
            <div className='space-y-2'>
              {(form.features || []).map((item, index) => (
                <div key={index} className='flex gap-2'>
                  <Input
                    type='text'
                    placeholder='عنوان (مثلاً تعداد دوره‌ها)'
                    fullWidth
                    value={item.label || ''}
                    onChange={(value) =>
                      handleFeatureChange(index, 'label', value)
                    }
                    className='text-xs'
                  />
                  <Input
                    type='text'
                    placeholder='مقدار (مثلاً ۵ دوره)'
                    fullWidth
                    value={item.value || ''}
                    onChange={(value) =>
                      handleFeatureChange(index, 'value', value)
                    }
                    className='text-xs'
                  />
                  <IconButton
                    icon={BiTrash}
                    onClick={() => removeFeature(index)}
                    color='#F82525'
                    hoverIconColor='#FFFFFF'
                    size={16}
                  />
                </div>
              ))}
              <OutlineButton
                color='green'
                onClick={addFeature}
                className='mt-1 px-2.5 py-0.5 text-[11px]'
              >
                + افزودن مورد جدید
              </OutlineButton>
            </div>
          </div>

          <div className='grid grid-cols-3 gap-3 pt-4'>
            <div>
              <label className='mb-1 block text-xs font-medium'>
                قیمت پایه (تومان)
              </label>
              <Input
                value={form.price}
                fullWidth
                onChange={(value) => handleChange('price', value)}
                className='text-xs'
                required
                thousandSeparator
                errorMessage={errorMessages.price}
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-medium'>
                مبلغ تخفیف (تومان)
              </label>
              <Input
                value={form.discountAmount}
                fullWidth
                onChange={(value) => handleChange('discountAmount', value)}
                className='text-xs'
                thousandSeparator
                placeholder='مثلاً 200000'
                errorMessage={errorMessages.discountAmount}
              />
              <p className='mt-1 text-[10px] text-subtext-light dark:text-subtext-dark'>
                قیمت نهایی = قیمت پایه - مبلغ تخفیف
              </p>
            </div>

            <div>
              <label className='mb-1 block text-xs font-medium'>
                مدت اشتراک (روز)
              </label>
              <Input
                type='number'
                value={form.durationInDays}
                fullWidth
                onChange={(value) => handleChange('durationInDays', value)}
                className='text-xs'
                placeholder='مثلاً 30 برای ماهانه، 90 برای سه ماهه'
                required
                errorMessage={errorMessages.durationInDays}
              />
            </div>
          </div>

          <div>
            <label className='mb-1 block text-xs font-medium'>
              لیبل بازه پرداخت (برای نمایش)
            </label>
            <Input
              type='text'
              value={form.intervalLabel}
              fullWidth
              onChange={(value) => handleChange('intervalLabel', value)}
              className='text-sm'
              placeholder='مثلاً: ماهانه، سه ماهه، یک‌ساله'
              required
              errorMessage={errorMessages.intervalLabel}
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-medium'>
              افزودن دوره به پلن
            </label>
            <div className='flex gap-2'>
              <DropDown
                options={courses.map((course) => ({
                  label: `${course.title} ${course.activeStatus ? '' : '(غیرفعال)'}`,
                  value: course.id,
                }))}
                value={selectedCourseId}
                onChange={(val) => handleAddCourse(val)}
                placeholder='انتخاب دوره ...'
                fullWidth={true}
                className='text-sm'
                optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
              />
            </div>

            {form.courseIds.length > 0 ? (
              <div className='mt-2 flex flex-wrap gap-2'>
                {form.courseIds.map((courseId) => {
                  const course = courses.find((c) => c.id === courseId);
                  return (
                    <span
                      key={courseId}
                      className='flex items-center gap-1 rounded-full bg-foreground-light px-3 py-1 text-xs dark:bg-foreground-dark'
                    >
                      {course?.title || `Course #${courseId}`}
                      <button
                        type='button'
                        onClick={() => handleRemoveCourse(courseId)}
                        className='mr-2 text-red'
                      >
                        <IoClose size={16} />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className='mt-1 text-[11px] text-subtext-light dark:text-subtext-dark'>
                هنوز دوره‌ای به این پلن اضافه نشده است.
              </p>
            )}
          </div>

          <div className='flex items-center justify-between'>
            <Checkbox
              size='small'
              checked={form.isActive}
              onChange={(checked) => handleChange('isActive', checked)}
              label='فعال بودن پلن'
              labelClass='text-xs'
            />

            <div className='flex gap-2'>
              {editingId && (
                <Button
                  color='red'
                  onClick={resetForm}
                  className='text-xs md:text-sm'
                >
                  انصراف از ویرایش
                </Button>
              )}

              <Button
                type='submit'
                isLoading={loading}
                className='text-xs md:text-sm'
              >
                {loading
                  ? 'در حال ذخیره...'
                  : editingId
                    ? 'ذخیره تغییرات'
                    : 'ایجاد پلن'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* لیست پلن‌های موجود */}
      <div className='space-y-3'>
        {plans.length === 0 ? (
          <div className='rounded-2xl bg-surface-light p-4 text-sm shadow dark:bg-surface-dark'>
            هنوز هیچ پلنی ثبت نشده است.
          </div>
        ) : (
          plans.map((plan) => {
            const basePrice = plan.price || 0;
            const discount = plan.discountAmount || 0;
            const finalPrice = Math.max(basePrice - discount, 0);

            return (
              <div
                key={plan.id}
                className='flex flex-col gap-2 rounded-2xl bg-surface-light p-4 shadow dark:bg-surface-dark'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-sm font-semibold'>{plan.name}</h3>

                    {/* قیمت‌ها */}
                    <div className='mt-1 space-y-0.5 text-xs'>
                      <p className='text-subtext-light dark:text-subtext-dark'>
                        قیمت پایه:{' '}
                        <span className='font-semibold'>
                          {basePrice.toLocaleString('fa-IR')} تومان
                        </span>
                      </p>

                      {discount > 0 && (
                        <p className='text-[11px] text-red'>
                          تخفیف:{' '}
                          <span className='font-semibold'>
                            {discount.toLocaleString('fa-IR')} تومان
                          </span>
                        </p>
                      )}

                      <p className='text-xs'>
                        قیمت نهایی:{' '}
                        <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                          {finalPrice.toLocaleString('fa-IR')} تومان
                        </span>{' '}
                        /{' '}
                        <span className='text-[11px] text-subtext-light dark:text-subtext-dark'>
                          {plan.intervalLabel || 'بدون برچسب'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      plan.isActive
                        ? 'bg-green-light bg-opacity-10 text-green-light dark:text-green-dark'
                        : 'bg-red bg-opacity-10 text-red'
                    }`}
                  >
                    {plan.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                {plan.description && (
                  <p className='text-xs text-subtext-light dark:text-subtext-dark'>
                    {plan.description}
                  </p>
                )}

                {plan.planCourses && plan.planCourses.length > 0 && (
                  <div className='border-t border-slate-300 border-opacity-50 pt-2 dark:border-slate-100'>
                    <p className='mb-1 text-[11px] font-semibold dark:text-slate-200'>
                      دوره‌ها:
                    </p>
                    <ul className='flex flex-wrap gap-1 text-[11px] text-slate-600 dark:text-slate-300'>
                      {plan.planCourses.map((pc) => (
                        <li
                          key={pc.id}
                          className='rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700'
                        >
                          {pc.course?.title || `Course #${pc.courseId}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className='mt-2 flex justify-end gap-2'>
                  <ActionButtonIcon
                    color='blue'
                    icon={LuPencil}
                    size={12}
                    onClick={() => handleEdit(plan)}
                  />
                  <ActionButtonIcon
                    color='red'
                    icon={LuTrash}
                    size={12}
                    onClick={() => handleShowDeleteModal(plan.id)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      {showDeleteModal && (
        <Modal
          title='حذف پلن'
          desc='آیا از حذف پلن مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteModal(false)}
          secondaryButtonClick={handleDelete}
        />
      )}
    </div>
  );
};

SubscriptionsAdminClient.propTypes = {
  plans: PropTypes.array.isRequired,
  courses: PropTypes.array.isRequired,
};

export default SubscriptionsAdminClient;
