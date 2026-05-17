export interface PasswordRule {
    id: string;
    label: string;
    test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    {
        id: 'length',
        label: 'At least 8 characters',
        test: (p) => p.length >= 8,
    },
    {
        id: 'categories',
        label: 'At least 3 of the following:',
        test: (p) => {
            let count = 0;
            if (/[a-z]/.test(p)) count++;
            if (/[A-Z]/.test(p)) count++;
            if (/[0-9]/.test(p)) count++;
            if (/[!@#$%^&*(),.?":{}|<>]/.test(p)) count++;
            return count >= 3;
        },
    },
    {
        id: 'lowercase',
        label: 'Lower case letters (a-z)',
        test: (p) => /[a-z]/.test(p),
    },
    {
        id: 'uppercase',
        label: 'Upper case letters (A-Z)',
        test: (p) => /[A-Z]/.test(p),
    },
    {
        id: 'numbers',
        label: 'Numbers (0-9)',
        test: (p) => /[0-9]/.test(p),
    },
    {
        id: 'special',
        label: 'Special characters (e.g. !@#$%^&*)',
        test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
    },
    {
        id: 'repeated',
        label: 'No more than 2 identical characters in a row',
        test: (p) => !/(.)\1\1/.test(p),
    },
];

export const validatePassword = (password: string) => {
    return PASSWORD_RULES.every(rule => rule.test(password));
};
