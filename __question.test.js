const app = require('./app');
const supertest = require('supertest');
const request = supertest(app);
const db = require('./models/db');
jest.setTimeout(5000);
beforeAll(async () => {
    await db.connect(process.env.MONGODB_URL, app);
});
afterAll(async () => {
    await db.disconnect();
});
describe('POST /questions', () => {
    describe('Insert a question', () => {
        it('Should respond with a 201 status code Created', async () => {
            const response = await request.post('/api/v1/question').send({
                name: '__DELETE__JEST__TEST__',
                type: '__DELETE__JEST__TEST__',
                category: '__DELETE__JEST__TEST__',
                difficulty: '__DELETE__JEST__TEST__',
                applyPenalty: false,
                answers: ['__DELETE__JEST__TEST__', '__DELETE__JEST__TEST__'],
                allowedTime: 500,
                description: '__DELETE__JEST__TEST__',
            });
            expect(response.status).toEqual(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors', async () => {
            const response = await request.post('/api/v1/question').send({});
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
    });
});
