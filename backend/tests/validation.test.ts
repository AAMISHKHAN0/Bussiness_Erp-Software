import { body, validationResult } from 'express-validator';

describe('express-validator rules (login / API bodies)', () => {
    it('rejects invalid email', async () => {
        const req: any = { body: { email: 'not-an-email', password: 'x' } };
        await body('email').trim().isEmail().run(req);
        expect(validationResult(req).isEmpty()).toBe(false);
    });

    it('accepts valid email', async () => {
        const req: any = { body: { email: 'user@example.com', password: 'x' } };
        await body('email').trim().isEmail().run(req);
        expect(validationResult(req).isEmpty()).toBe(true);
    });

    it('register password rule rejects weak password', async () => {
        const req: any = { body: { password: 'short' } };
        await body('password')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
            .run(req);
        expect(validationResult(req).isEmpty()).toBe(false);
    });
});
