/* eslint-disable no-undef */
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import Modal from '@/components/modules/Modal/Modal';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

import { FiEdit2 } from 'react-icons/fi';
import { MdAddLocationAlt } from 'react-icons/md';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import DropDown from '@/components/Ui/DropDown/DropDwon';

function safeStr(v) {
  return String(v ?? '');
}

function validatePhone(phone) {
  return /^09\d{9}$/.test(String(phone || '').trim());
}

/* -------------------------
 * Address Modal (create/edit)
 * ------------------------ */
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
    const d = initialData || {};
    setFullName(safeStr(d.fullName ? d.fullName : defaultFullname));
    setPhone(safeStr(d.phone ? d.phone : defaultPhone));
    setProvince(safeStr(d.province));
    setCity(safeStr(d.city));
    setAddress1(safeStr(d.address1));
    setPostalCode(safeStr(d.postalCode));
    setNotes(safeStr(d.notes));
    setIsDefault(!!d.isDefault);
    setErrors({});
  }, [open, initialData]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/locality/provinces', { cache: 'no-store' });
      const data = await res.json();
      setProvinceOptions(
        (data.items || []).map((p) => ({ label: p, value: p }))
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
        {
          cache: 'no-store',
        }
      );
      const data = await res.json();
      setCityOptions((data.items || []).map((c) => ({ label: c, value: c })));
      setCity(''); // وقتی استان عوض شد شهر ریست شود
    })();
  }, [province]);

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'نام و نام خانوادگی گیرنده الزامی است.';
    if (!validatePhone(phone)) e.phone = 'شماره موبایل گیرنده معتبر نیست.';
    if (!province.trim()) e.province = 'استان الزامی است.';
    if (!city.trim()) e.city = 'شهر الزامی است.';
    if (!address1.trim()) e.address1 = 'آدرس الزامی است.';
    if (!postalCode.trim()) e.postalCode = 'کد پستی الزامی است.';
    const pc = postalCode.trim();
    if (pc && !/^\d{10}$/.test(pc)) e.postalCode = 'کدپستی باید ۱۰ رقم باشد.';

    setErrors(e);
    return Object.keys(e).length === 0;
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
        isDefault: !!isDefault,
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
    } catch (e) {
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
      icon={MdAddLocationAlt}
      iconSize={34}
      primaryButtonClick={handleSave}
      secondaryButtonClick={onClose}
      primaryButtonText={saving ? 'در حال ذخیره...' : 'ذخیره'}
      secondaryButtonText='انصراف'
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
          onChange={(val) => setProvince(val || '')}
          placeholder='انتخاب استان'
          fullWidth
          errorMessage={errors.province}
          optionClassName='max-h-80 overflow-y-auto custom-scrollbar'
        />

        <DropDown
          label='شهر'
          options={cityOptions}
          value={city || undefined}
          onChange={(val) => setCity(val || '')}
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

        <div className='flex items-center gap-2 sm:col-span-2'>
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

/* -------------------------
 * Main Component
 * ------------------------ */
const UserInformationCard = ({ className, onAddressSelect, hasShopCart }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const { user } = useAuthUser();
  const { loadUser } = useUserActions();

  // user info
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

  // addresses
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState('create'); // create | edit
  const [addressToEdit, setAddressToEdit] = useState(null);

  // ✔ فرم را بعد از لود شدن user آپدیت کن
  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || '');
      setLastname(user.lastname || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
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

      // انتظار: {items:[...]} یا [...]
      const list = Array.isArray(data) ? data : data?.items || [];

      // از آخر به اول
      const sorted = [...list].sort((a, b) => Number(b.id) - Number(a.id));
      setAddresses(sorted);

      // اگر هیچ آدرسی نداریم
      if (!sorted.length) {
        setSelectedAddressId(null);
        if (typeof onAddressSelect === 'function') onAddressSelect(null);
        return;
      }

      // پیش‌فرض: اول default، اگر نبود آخرین (sorted[0]) چون از آخر به اوله
      const defaultAddr = sorted.find((a) => a.isDefault) || null;
      const fallbackSelectedId = defaultAddr?.id ?? sorted[0]?.id ?? null;

      // ✅ انتخاب نهایی با حفظ انتخاب قبلی (اگر هنوز وجود دارد)
      let finalSelectedId = fallbackSelectedId;

      setSelectedAddressId((prevSelectedId) => {
        const stillExists = sorted.some((a) => a.id === prevSelectedId);

        // اگر انتخاب قبلی هنوز معتبر است، همان را نگه دار
        finalSelectedId = stillExists ? prevSelectedId : fallbackSelectedId;

        return finalSelectedId;
      });

      // ✅ آبجکت انتخاب شده را پیدا کن و به والد بده
      const selectedObj =
        sorted.find((a) => a.id === finalSelectedId) ||
        sorted.find((a) => a.id === fallbackSelectedId) ||
        null;

      if (selectedObj && typeof onAddressSelect === 'function') {
        onAddressSelect(selectedObj);
      }
    } catch (e) {
      setAddresses([]);
      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!hasShopCart) return;
    fetchAddresses();
  }, [user?.id]);

  const validateInputs = () => {
    const errors = {};

    if (!firstname.trim()) errors.firstname = 'لطفا نام خود را وارد کنید';
    else if (firstname.length < 2)
      errors.firstname = 'نام حداقل ۲ کاراکتر باشد';

    if (!lastname.trim())
      errors.lastname = 'لطفا نام خانوادگی خود را وارد کنید';
    else if (lastname.length < 3)
      errors.lastname = 'نام خانوادگی حداقل ۳ کاراکتر باشد';

    if (!phone.trim()) errors.phone = 'لطفاً شماره موبایل خود را وارد کنید';
    else if (!validatePhone(phone)) errors.phone = 'شماره موبایل معتبر نیست';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email))
      errors.email = 'یک ایمیل معتبر وارد کنید';

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
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره رخ داد');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const onPickAddress = (id) => {
    setSelectedAddressId(id);
    const addr = addresses.find((a) => a.id === id) || null;
    if (addr && typeof onAddressSelect === 'function') onAddressSelect(addr);
  };

  const openCreateAddress = () => {
    setAddressModalMode('create');
    setAddressToEdit(null);
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr) => {
    setAddressModalMode('edit');
    setAddressToEdit(addr);
    setAddressModalOpen(true);
  };

  const handleAddressSaved = async (saved) => {
    // ریفرش لیست
    await fetchAddresses();

    // اگر create بود، معمولا saved برمی‌گرده با id
    if (saved?.id) {
      setSelectedAddressId(saved.id);
    }
  };

  if (!user) {
    return (
      <div className='rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark'>
        <p>در حال بارگذاری اطلاعات کاربر...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-6 rounded-xl bg-surface-light p-4 shadow sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='text-lg font-semibold md:text-xl'>تکمیل اطلاعات</h2>

      {/* اطلاعات کاربر */}
      <div className='flex w-full flex-col gap-4 xl:w-2/3'>
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

      <Button
        shadow
        isLoading={isLoading}
        onClick={handleSubmitUserInfo}
        className='w-fit px-6 text-xs sm:text-sm'
      >
        ثبت اطلاعات کاربر
      </Button>

      {/* آدرس‌ها */}
      {hasShopCart && (
        <div className='mt-2'>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <h3 className='text-sm font-semibold md:text-base'>آدرس ارسال</h3>

            <Button
              shadow
              className='text-xs'
              onClick={openCreateAddress}
              icon={MdAddLocationAlt}
            >
              افزودن آدرس
            </Button>
          </div>

          {addressesLoading ? (
            <div className='rounded-xl bg-foreground-light p-4 text-sm text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
              در حال دریافت آدرس‌ها...
            </div>
          ) : addresses.length === 0 ? (
            <div className='rounded-xl bg-foreground-light p-4 text-sm text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
              آدرسی ثبت نشده است. لطفاً یک آدرس اضافه کنید.
            </div>
          ) : (
            <div className='space-y-3'>
              {addresses.map((addr) => {
                const active = addr.id === selectedAddressId;

                return (
                  <div
                    key={addr.id}
                    className={`group relative cursor-pointer rounded-xl border p-4 transition ${
                      active
                        ? 'border-accent bg-accent/5'
                        : 'border-gray-200 dark:border-foreground-dark'
                    }`}
                    onClick={() => onPickAddress(addr.id)}
                  >
                    {/* edit icon on hover */}
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditAddress(addr);
                      }}
                      className='absolute bottom-3 left-3 hidden rounded-lg p-2 text-subtext-light hover:bg-black/5 group-hover:flex dark:text-subtext-dark dark:hover:bg-white/5'
                      title='ویرایش آدرس'
                    >
                      <FiEdit2 size={16} />
                    </button>

                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex flex-col gap-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-faNa text-sm font-bold'>
                            {addr.province}، {addr.city}، {addr.address1}
                          </span>
                          {addr.isDefault && (
                            <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-2xs text-emerald-700'>
                              پیش‌فرض
                            </span>
                          )}
                        </div>

                        <div className='font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
                          کدپستی: {addr.postalCode}
                        </div>
                        <div className='text-xs text-subtext-light dark:text-subtext-dark'>
                          گیرنده:‌{addr.fullName}
                        </div>
                        <div className='font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
                          موبایل گیرنده: {addr.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Address Modal */}
      <AddressModal
        open={addressModalOpen}
        mode={addressModalMode}
        initialData={addressToEdit}
        onClose={() => setAddressModalOpen(false)}
        onSaved={handleAddressSaved}
        defaultFullname={firstname + ' ' + lastname}
        defaultPhone={phone}
      />
    </div>
  );
};

UserInformationCard.propTypes = {
  className: PropTypes.string,
  onAddressSelect: PropTypes.func, // برای اینکه توی PaymentPage آدرس انتخاب‌شده رو بگیری و shipping رو حساب کنی
  hasShopCart: PropTypes.bool,
};

export default UserInformationCard;
