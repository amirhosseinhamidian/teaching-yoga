/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/Ui/Input/Input';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Modal from '@/components/modules/Modal/Modal';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

import {
  HiOutlineCheck,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineUser,
  HiOutlineUserCircle,
} from 'react-icons/hi2';

function safeStr(value) {
  return String(value ?? '');
}

function validatePhone(phone) {
  return /^09\d{9}$/.test(String(phone || '').trim());
}

function AddressModal({
  open,
  mode,
  initialData,
  onClose,
  onSaved,
  defaultFullname = '',
  defaultPhone = '',
}) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const isEdit = mode === 'edit';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address1, setAddress1] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [provinceOptions, setProvinceOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  useEffect(() => {
    if (!open) return;

    const data = initialData || {};

    setFullName(safeStr(data.fullName ? data.fullName : defaultFullname));
    setPhone(safeStr(data.phone ? data.phone : defaultPhone));
    setProvince(safeStr(data.province));
    setCity(safeStr(data.city));
    setAddress1(safeStr(data.address1));
    setPostalCode(safeStr(data.postalCode));
    setNotes(safeStr(data.notes));
    setIsDefault(Boolean(data.isDefault));
    setErrors({});
  }, [open, initialData, defaultFullname, defaultPhone]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/locality/provinces', {
        cache: 'no-store',
      });
      const data = await res.json();

      setProvinceOptions(
        (data.items || []).map((item) => ({
          label: item,
          value: item,
        }))
      );
    })();
  }, []);

  useEffect(() => {
    if (!province) {
      setCity('');
      setCityOptions([]);
      return;
    }

    (async () => {
      const res = await fetch(
        `/api/locality/cities?province=${encodeURIComponent(province)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      const items = data.items || [];

      setCityOptions(
        items.map((item) => ({
          label: item,
          value: item,
        }))
      );

      // در حالت ویرایش، شهر فعلی را اگر متعلق به استان است حفظ کن.
      setCity((prev) => (prev && items.includes(prev) ? prev : ''));
    })();
  }, [province]);

  const validate = () => {
    const nextErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'نام و نام خانوادگی گیرنده الزامی است.';
    }

    if (!validatePhone(phone)) {
      nextErrors.phone = 'شماره موبایل گیرنده معتبر نیست.';
    }

    if (!province.trim()) {
      nextErrors.province = 'استان الزامی است.';
    }

    if (!city.trim()) {
      nextErrors.city = 'شهر الزامی است.';
    }

    if (!address1.trim()) {
      nextErrors.address1 = 'آدرس الزامی است.';
    }

    if (!postalCode.trim()) {
      nextErrors.postalCode = 'کد پستی الزامی است.';
    }

    const normalizedPostalCode = postalCode.trim();
    if (normalizedPostalCode && !/^\d{10}$/.test(normalizedPostalCode)) {
      nextErrors.postalCode = 'کدپستی باید ۱۰ رقم باشد.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.showErrorToast('لطفاً فیلدهای آدرس را درست وارد کنید.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        province: province.trim(),
        city: city.trim(),
        address1: address1.trim(),
        postalCode: postalCode.trim() || null,
        notes: notes.trim() || null,
        isDefault: Boolean(isDefault),
      };

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      let res;

      if (isEdit && initialData?.id) {
        res = await fetch(`${base}/api/user/addresses/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${base}/api/user/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در ذخیره آدرس');
        return;
      }

      toast.showSuccessToast(isEdit ? 'آدرس بروزرسانی شد' : 'آدرس ثبت شد');
      onSaved?.(data);
      onClose?.();
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در ذخیره آدرس');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title={isEdit ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
      desc='اطلاعات گیرنده و آدرس را وارد کنید.'
      icon={HiOutlineMapPin}
      iconSize={26}
      primaryButtonClick={handleSave}
      secondaryButtonClick={onClose}
      primaryButtonText={saving ? 'در حال ذخیره...' : 'ذخیره آدرس'}
      secondaryButtonText='انصراف'
      loadingPrimaryButton={saving}
      className='overflow-y-auto'
    >
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          label='نام و نام خانوادگی گیرنده'
          value={fullName}
          onChange={setFullName}
          errorMessage={errors.fullName}
          className='bg-surface-light dark:bg-surface-dark'
        />

        <Input
          label='موبایل گیرنده'
          value={phone}
          onChange={setPhone}
          maxLength={11}
          errorMessage={errors.phone}
          className='bg-surface-light dark:bg-surface-dark'
        />

        <DropDown
          label='استان'
          options={provinceOptions}
          value={province || undefined}
          onChange={(value) => setProvince(value || '')}
          placeholder='انتخاب استان'
          fullWidth
          errorMessage={errors.province}
          optionClassName='max-h-80 overflow-y-auto custom-scrollbar'
        />

        <DropDown
          label='شهر'
          options={cityOptions}
          value={city || undefined}
          onChange={(value) => setCity(value || '')}
          placeholder={province ? 'انتخاب شهر' : 'اول استان را انتخاب کنید'}
          fullWidth
          errorMessage={errors.city}
          optionClassName='max-h-80 overflow-y-auto custom-scrollbar'
        />

        <div className='sm:col-span-2'>
          <Input
            label='آدرس'
            value={address1}
            onChange={setAddress1}
            errorMessage={errors.address1}
            className='bg-surface-light dark:bg-surface-dark'
          />
        </div>

        <Input
          label='کدپستی'
          value={postalCode}
          onChange={setPostalCode}
          maxLength={10}
          errorMessage={errors.postalCode}
          className='bg-surface-light dark:bg-surface-dark'
        />

        <Input
          label='توضیحات (اختیاری)'
          value={notes}
          onChange={setNotes}
          className='bg-surface-light dark:bg-surface-dark'
        />

        <div className='rounded-2xl border border-black/5 bg-background-light/40 p-3 sm:col-span-2 dark:border-white/10 dark:bg-background-dark/30'>
          <Checkbox
            checked={isDefault}
            onChange={setIsDefault}
            labelClass='text-xs text-subtext-light dark:text-subtext-dark'
            label='این آدرس پیش‌فرض باشد'
            size='small'
          />
        </div>
      </div>
    </Modal>
  );
}

AddressModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
  defaultFullname: PropTypes.string,
  defaultPhone: PropTypes.string,
};

const UserInformationCard = ({ className, onAddressSelect, hasShopCart }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const { user } = useAuthUser();
  const { loadUser } = useUserActions();

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errorMessages, setErrorMessages] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
  });

  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState('create');
  const [addressToEdit, setAddressToEdit] = useState(null);

  useEffect(() => {
    if (!user) return;

    setFirstname(user.firstname || '');
    setLastname(user.lastname || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const res = await fetch(`${base}/api/user/addresses`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAddresses([]);
        toast.showErrorToast(data?.error || 'خطا در دریافت آدرس‌ها');
        return;
      }

      const list = Array.isArray(data) ? data : data?.items || [];
      const sorted = [...list].sort((a, b) => Number(b.id) - Number(a.id));

      setAddresses(sorted);

      if (!sorted.length) {
        setSelectedAddressId(null);
        onAddressSelect?.(null);
        return;
      }

      const defaultAddress = sorted.find((item) => item.isDefault) || null;
      const fallbackSelectedId = defaultAddress?.id ?? sorted[0]?.id ?? null;

      let finalSelectedId = fallbackSelectedId;

      setSelectedAddressId((previousSelectedId) => {
        const stillExists = sorted.some(
          (item) => item.id === previousSelectedId
        );

        finalSelectedId = stillExists ? previousSelectedId : fallbackSelectedId;

        return finalSelectedId;
      });

      const selectedObject =
        sorted.find((item) => item.id === finalSelectedId) ||
        sorted.find((item) => item.id === fallbackSelectedId) ||
        null;

      if (selectedObject) {
        onAddressSelect?.(selectedObject);
      }
    } catch (error) {
      setAddresses([]);
      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !hasShopCart) return;
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasShopCart]);

  const validateInputs = () => {
    const errors = {};

    if (!firstname.trim()) errors.firstname = 'لطفا نام خود را وارد کنید';
    else if (firstname.length < 2) {
      errors.firstname = 'نام حداقل ۲ کاراکتر باشد';
    }

    if (!lastname.trim()) {
      errors.lastname = 'لطفا نام خانوادگی خود را وارد کنید';
    } else if (lastname.length < 3) {
      errors.lastname = 'نام خانوادگی حداقل ۳ کاراکتر باشد';
    }

    if (!phone.trim()) errors.phone = 'لطفاً شماره موبایل خود را وارد کنید';
    else if (!validatePhone(phone)) errors.phone = 'شماره موبایل معتبر نیست';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email)) {
      errors.email = 'یک ایمیل معتبر وارد کنید';
    }

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitUserInfo = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('لطفاً ورودی‌ها را به درستی تکمیل کنید');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        firstname,
        lastname,
        email,
        phone,
        username: user.username,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.showSuccessToast('اطلاعات با موفقیت به‌روزرسانی شد');
        loadUser();
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره رخ داد');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const onPickAddress = (id) => {
    setSelectedAddressId(id);
    const address = addresses.find((item) => item.id === id) || null;
    if (address) onAddressSelect?.(address);
  };

  const openCreateAddress = () => {
    setAddressModalMode('create');
    setAddressToEdit(null);
    setAddressModalOpen(true);
  };

  const openEditAddress = (address) => {
    setAddressModalMode('edit');
    setAddressToEdit(address);
    setAddressModalOpen(true);
  };

  const handleAddressSaved = async (saved) => {
    await fetchAddresses();

    if (saved?.id) {
      setSelectedAddressId(saved.id);
    }
  };

  if (!user) {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className={`flex min-h-[220px] items-center justify-center p-6 ${className || ''}`}
      >
        <div className='text-center'>
          <span className='mx-auto block h-9 w-9 animate-spin rounded-full border-[3px] border-secondary/20 border-t-secondary' />
          <p className='mt-3 text-xs text-subtext-light dark:text-subtext-dark'>
            در حال بارگذاری اطلاعات کاربر...
          </p>
        </div>
      </SiteCard>
    );
  }

  return (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`relative overflow-hidden ${className || ''}`}
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div className='relative z-10'>
        <div className='flex items-center gap-3 border-b border-black/5 px-5 py-5 sm:px-6 dark:border-white/10'>
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineUserCircle size={23} />
          </span>

          <div>
            <p className='text-[9px] font-bold text-secondary sm:text-[10px]'>
              اطلاعات سفارش‌دهنده
            </p>
            <h2 className='mt-0.5 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
              تکمیل اطلاعات
            </h2>
          </div>
        </div>

        <div className='space-y-7 p-5 sm:p-6'>
          <section>
            <div className='mb-4 flex items-center gap-2'>
              <HiOutlineUser size={18} className='text-secondary' />
              <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
                اطلاعات شخصی
              </h3>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Input
                value={firstname}
                onChange={setFirstname}
                placeholder='نام'
                label='نام'
                maxLength={25}
                errorMessage={errorMessages.firstname}
              />

              <Input
                value={lastname}
                onChange={setLastname}
                placeholder='نام خانوادگی'
                label='نام خانوادگی'
                maxLength={30}
                errorMessage={errorMessages.lastname}
              />

              <Input
                value={phone}
                onChange={setPhone}
                placeholder='شماره موبایل'
                label='شماره موبایل'
                maxLength={11}
                errorMessage={errorMessages.phone}
                required
              />

              <Input
                value={email}
                onChange={setEmail}
                placeholder='ایمیل (اختیاری)'
                label='ایمیل'
                type='email'
                maxLength={50}
                errorMessage={errorMessages.email}
              />
            </div>

            <SiteButton
              type='button'
              variant='outline'
              size='md'
              onClick={handleSubmitUserInfo}
              disabled={isLoading}
              className='mt-4 w-full sm:w-auto'
            >
              {isLoading ? 'در حال ثبت...' : 'ثبت اطلاعات کاربر'}
            </SiteButton>
          </section>

          {hasShopCart && (
            <section className='border-t border-black/5 pt-6 dark:border-white/10'>
              <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <HiOutlineMapPin size={18} className='text-secondary' />
                  <div>
                    <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
                      آدرس ارسال
                    </h3>
                    <p className='mt-0.5 text-[9px] text-subtext-light dark:text-subtext-dark'>
                      سفارش محصولات به این آدرس ارسال می‌شود
                    </p>
                  </div>
                </div>

                <SiteButton
                  type='button'
                  variant='outline'
                  size='sm'
                  startIcon={HiOutlinePlus}
                  onClick={openCreateAddress}
                >
                  افزودن آدرس
                </SiteButton>
              </div>

              {addressesLoading ? (
                <div className='rounded-2xl border border-black/5 bg-background-light/45 p-4 text-xs text-subtext-light dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
                  در حال دریافت آدرس‌ها...
                </div>
              ) : addresses.length === 0 ? (
                <div className='rounded-2xl border border-dashed border-secondary/20 bg-secondary/[0.04] p-5 text-center'>
                  <HiOutlineMapPin
                    size={26}
                    className='mx-auto text-secondary/50'
                  />
                  <p className='mt-2 text-xs text-subtext-light dark:text-subtext-dark'>
                    آدرسی ثبت نشده است. لطفاً یک آدرس اضافه کنید.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {addresses.map((address) => {
                    const active = address.id === selectedAddressId;

                    return (
                      <div
                        key={address.id}
                        role='button'
                        tabIndex={0}
                        onClick={() => onPickAddress(address.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onPickAddress(address.id);
                          }
                        }}
                        className={`group relative cursor-pointer rounded-[20px] border p-4 transition-all duration-200 ${
                          active
                            ? 'border-secondary bg-secondary/[0.06] shadow-[0_10px_30px_rgba(38,145,125,0.08)]'
                            : 'border-black/5 bg-background-light/40 hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/25'
                        }`}
                      >
                        <div className='flex items-start gap-3'>
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              active
                                ? 'bg-secondary text-white'
                                : 'bg-secondary/10 text-secondary'
                            }`}
                          >
                            {active ? (
                              <HiOutlineCheck size={18} />
                            ) : (
                              <HiOutlineMapPin size={18} />
                            )}
                          </span>

                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <strong className='font-faNa text-xs leading-6 text-text-light sm:text-sm dark:text-text-dark'>
                                {address.province}، {address.city}،{' '}
                                {address.address1}
                              </strong>

                              {address.isDefault && (
                                <SiteBadge variant='secondary' size='sm'>
                                  پیش‌فرض
                                </SiteBadge>
                              )}
                            </div>

                            <div className='mt-2 grid gap-1 text-[10px] leading-5 text-subtext-light sm:grid-cols-2 dark:text-subtext-dark'>
                              <span className='font-faNa'>
                                کدپستی: {address.postalCode}
                              </span>
                              <span>گیرنده: {address.fullName}</span>
                              <span className='font-faNa sm:col-span-2'>
                                موبایل گیرنده: {address.phone}
                              </span>
                            </div>
                          </div>

                          <button
                            type='button'
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditAddress(address);
                            }}
                            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-subtext-light transition-all hover:bg-secondary/10 hover:text-secondary dark:bg-white/5 dark:text-subtext-dark'
                            title='ویرایش آدرس'
                            aria-label='ویرایش آدرس'
                          >
                            <HiOutlinePencilSquare size={17} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedAddress && (
                <p className='mt-3 text-[9px] font-bold text-secondary'>
                  آدرس انتخاب‌شده برای محاسبه روش و هزینه ارسال استفاده می‌شود.
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      <AddressModal
        open={addressModalOpen}
        mode={addressModalMode}
        initialData={addressToEdit}
        onClose={() => setAddressModalOpen(false)}
        onSaved={handleAddressSaved}
        defaultFullname={`${firstname} ${lastname}`.trim()}
        defaultPhone={phone}
      />
    </SiteCard>
  );
};

UserInformationCard.propTypes = {
  className: PropTypes.string,
  onAddressSelect: PropTypes.func,
  hasShopCart: PropTypes.bool,
};

export default UserInformationCard;
