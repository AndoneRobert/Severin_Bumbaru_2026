import { useCallback, useState } from 'react';

const DEFAULT_FORM = {
    title: '',
    description: '',
    category: 'Infrastructură',
    priority: 'Medie',
    lat: null,
    lng: null,
};

export const useIssueForm = ({ initialForm = DEFAULT_FORM, initialStep = 1 } = {}) => {
    const [form, setForm] = useState(initialForm);
    const [step, setStep] = useState(initialStep);
    const [formErrors, setFormErrors] = useState({});

    const validate = useCallback((value = form) => {
        const errs = {};
        if (!value.title?.trim()) errs.title = 'Titlul este obligatoriu.';
        if ((value.title || '').length > 100) errs.title = 'Max 100 caractere.';
        if (!value.description?.trim()) errs.description = 'Descrierea este obligatorie.';
        if (!value.lat || !value.lng) errs.location = 'Selectează locația pe hartă.';
        return errs;
    }, [form]);

    const nextStep = useCallback(() => {
        setFormErrors({});
        setStep((prev) => Math.min(3, prev + 1));
    }, []);

    const prevStep = useCallback(() => {
        setStep((prev) => Math.max(1, prev - 1));
    }, []);

    const resetForm = useCallback((nextForm = initialForm) => {
        setForm(nextForm);
        setFormErrors({});
        setStep(initialStep);
    }, [initialForm, initialStep]);

    return {
        form,
        setForm,
        step,
        setStep,
        formErrors,
        setFormErrors,
        validate,
        nextStep,
        prevStep,
        resetForm,
    };
};

export default useIssueForm;
