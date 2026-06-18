import { useEffect, useState } from 'react';
import {
  apiFetchDistricts,
  apiFetchProvinces,
  apiFetchWards,
} from '../../services/api';

const emptyOptions = [];

const LocationFields = ({
  formData,
  setFormData,
  disabled = false,
  prefix = 'location',
}) => {
  const [provinces, setProvinces] = useState(emptyOptions);
  const [districts, setDistricts] = useState(emptyOptions);
  const [wards, setWards] = useState(emptyOptions);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading((current) => ({ ...current, provinces: true }));
    apiFetchProvinces()
      .then((data) => {
        if (!cancelled) {
          setProvinces(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProvinces(emptyOptions);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading((current) => ({ ...current, provinces: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const provinceCode = formData.provinceCode || '';
    if (!provinceCode) {
      setDistricts(emptyOptions);
      setWards(emptyOptions);
      return undefined;
    }

    let cancelled = false;
    setLoading((current) => ({ ...current, districts: true }));
    apiFetchDistricts(provinceCode)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setDistricts(data);
        if (!data.some((option) => option.code === formData.districtCode)) {
          setFormData((current) => ({
            ...current,
            districtCode: '',
            wardCode: '',
          }));
          setWards(emptyOptions);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDistricts(emptyOptions);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading((current) => ({ ...current, districts: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formData.provinceCode, formData.districtCode, setFormData]);

  useEffect(() => {
    const provinceCode = formData.provinceCode || '';
    const districtCode = formData.districtCode || '';
    if (!provinceCode || !districtCode) {
      setWards(emptyOptions);
      return undefined;
    }

    let cancelled = false;
    setLoading((current) => ({ ...current, wards: true }));
    apiFetchWards(provinceCode, districtCode)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setWards(data);
        if (!data.some((option) => option.code === formData.wardCode)) {
          setFormData((current) => ({
            ...current,
            wardCode: '',
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWards(emptyOptions);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading((current) => ({ ...current, wards: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formData.provinceCode, formData.districtCode, formData.wardCode, setFormData]);

  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      if (name === 'provinceCode') {
        return { ...current, provinceCode: value, districtCode: '', wardCode: '' };
      }
      if (name === 'districtCode') {
        return { ...current, districtCode: value, wardCode: '' };
      }
      return { ...current, [name]: value };
    });
  };

  return (
    <>
      <label htmlFor={`${prefix}-province`}>
        Tỉnh/Thành phố
        <select
          id={`${prefix}-province`}
          name="provinceCode"
          value={formData.provinceCode || ''}
          onChange={handleSelectChange}
          disabled={disabled || loading.provinces}
        >
          <option value="">{loading.provinces ? 'Đang tải tỉnh/thành...' : 'Chọn tỉnh/thành phố'}</option>
          {provinces.map((option) => (
            <option key={option.code} value={option.code}>{option.name}</option>
          ))}
        </select>
      </label>

      <label htmlFor={`${prefix}-district`}>
        Quận/Huyện
        <select
          id={`${prefix}-district`}
          name="districtCode"
          value={formData.districtCode || ''}
          onChange={handleSelectChange}
          disabled={disabled || !formData.provinceCode || loading.districts}
        >
          <option value="">
            {!formData.provinceCode
              ? 'Chọn tỉnh/thành trước'
              : loading.districts
                ? 'Đang tải quận/huyện...'
                : 'Chọn quận/huyện'}
          </option>
          {districts.map((option) => (
            <option key={option.code} value={option.code}>{option.name}</option>
          ))}
        </select>
      </label>

      <label htmlFor={`${prefix}-ward`}>
        Phường/Xã
        <select
          id={`${prefix}-ward`}
          name="wardCode"
          value={formData.wardCode || ''}
          onChange={handleSelectChange}
          disabled={disabled || !formData.districtCode || loading.wards}
        >
          <option value="">
            {!formData.districtCode
              ? 'Chọn quận/huyện trước'
              : loading.wards
                ? 'Đang tải phường/xã...'
                : 'Chọn phường/xã'}
          </option>
          {wards.map((option) => (
            <option key={option.code} value={option.code}>{option.name}</option>
          ))}
        </select>
      </label>
    </>
  );
};

export default LocationFields;
