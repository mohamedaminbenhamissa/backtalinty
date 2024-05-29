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
describe('GET /test', () => {
    describe('Get the list of tests', () => {
        it('Should respond with a 400 status code and the problem', async () => {
            const response = await request.get('/api/v1/test');
            expect(response.status).toEqual(500);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 200 status code and a list of tests', async () => {
            const response = await request
                .get('/api/v1/test')
                .send({ params: {} });
            expect(response.status).toBe(500);
            expect(response.text).toBeDefined();
        });
    });
    describe('Get informations about a test', () => {
        it('Should respond with a 400 status code and the problem', async () => {
            const response = await request.get('/api/v1/test');
            expect(response.status).toEqual(500);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 404 status code and Test not found', async () => {
            const response = await request.get(
                '/api/v1/test/624d6fead05a4ba130fd39b4'
            );
            expect(response.status).toBe(404);
            expect(response.text).toBe('Test not found');
        });
    });
});
describe('POST /test', () => {
    describe('Insert a test', () => {
        it('Should respond with a 201 status code Created', async () => {
            const response = await request.post('/api/v1/test').send({
                name: '__DELETE__JEST__TEST__',
                allowedTime: 500,
                scoreMin: 20,
                scoreMax: 80,
                category: 'Soft Skills',
                difficulty: 'Facile',
                questions: [
                    '624ea4cab3f75308dcab3088',
                    '624ea4e88f5997b5fb71e703',
                ],
                videoStart:
                    'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                videoEnd:
                    'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                randomQuestions: true,
                randomOrder: false,
                enableScreenshots: false,
                disableCopyPaste: false,
                enableExposureLimit: true,
                enableFeedback: true,
                trainingQuestions: 2,
                enableAdditionalTime: 20,
            });
            expect(response.status).toEqual(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors because questions ids are wrong', async () => {
            const response = await request.post('/api/v1/test').send({
                name: '__DELETE__JEST__TEST__',
                allowedTime: 500,
                scoreMin: 20,
                scoreMax: 80,
                category: 'Soft Skills',
                difficulty: 'Facile',
                questions: ['dddd', 'fsfsf'],
                videoStart:
                    'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                videoEnd:
                    'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                randomQuestions: true,
                randomOrder: false,
                enableScreenshots: false,
                disableCopyPaste: false,
                enableExposureLimit: true,
                enableFeedback: true,
                trainingQuestions: 2,
                enableAdditionalTime: 20,
            });
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors because questions are not unique', async () => {
            const response = await request.post('/api/v1/test').send({
                name: '__DELETE__JEST__TEST__',
                allowedTime: 500,
                scoreMin: 20,
                scoreMax: 80,
                category: 'Soft Skills',
                difficulty: 'Facile',
                questions: [
                    '624ea4cab3f75308dcab3088',
                    '624ea4cab3f75308dcab3088',
                ],
                videoStart:
                    'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                videoEnd:
                    'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                randomQuestions: true,
                randomOrder: false,
                enableScreenshots: false,
                disableCopyPaste: false,
                enableExposureLimit: true,
                enableFeedback: true,
                trainingQuestions: 2,
                enableAdditionalTime: 20,
            });
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it("Should respond with a 400 status code and errors because questions don't exist", async () => {
            const response = await request.post('/api/v1/test').send({
                name: '__DELETE__JEST__TEST__',
                allowedTime: 500,
                scoreMin: 20,
                scoreMax: 80,
                category: 'Soft Skills',
                difficulty: 'Facile',
                questions: [
                    '624ea4cab3f75308dcab6666',
                    '624ea4cab3f75308dcab6667',
                ],
                videoStart:
                    'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                videoEnd:
                    'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                randomQuestions: true,
                randomOrder: false,
                enableScreenshots: false,
                disableCopyPaste: false,
                enableExposureLimit: true,
                enableFeedback: true,
                trainingQuestions: 2,
                enableAdditionalTime: 20,
            });
            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
    });
    describe('Clone a test', () => {
        it('Should respond with a 201 status code Created', async () => {
            const response = await request.post(
                '/api/v1/test/624f4ae7eff06317a4e1d011'
            );
            expect(response.status).toEqual(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 404 status code', async () => {
            const response = await request.post(
                '/api/v1/test/666f4ae7eff06317a4e1d666'
            );
            expect(response.status).toEqual(400);
            expect(response.text).toBeDefined();
        });
    });
});
describe('PUT /test', () => {
    describe('Edit a test', () => {
        it("Should respond with a 500 status code because the tests don't exist", async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c66')
                .send({
                    name: '__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '624ea4cab3f75308dcab3088',
                        '624ea4e88f5997b5fb71e703',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });
            expect(response.status).toEqual(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c60')
                .send({
                    name: '__PATCH__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '624ea4cab3f75308dcab3088',
                        '624ea4e88f5997b5fb71e703',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });

            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c60')
                .send({
                    name: '__PATCH__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '624ea4cab3f75308dcab3088',
                        '624ea4e88f5997b5fb71e703',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });

            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c60')
                .send({
                    name: '__PATCH__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '624ea4cab3f75308dcab3088',
                        '624ea4e88f5997b5fb71e703',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });

            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c60')
                .send({
                    name: '__PATCH__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '624ea4cab3f75308dcab3088',
                        '624ea4e88f5997b5fb71e703',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });

            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c60')
                .send({
                    name: '__PATCH__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '624ea4cab3f75308dcab3088',
                        '624ea4e88f5997b5fb71e703',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });

            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 400 status code and errors because questions ids are wrong', async () => {
            const response = await request
                .patch('/api/v1/test/624ee1183ea24e35c3388c60')
                .send({
                    name: '__PATCH__DELETE__JEST__TEST__',
                    allowedTime: 500,
                    scoreMin: 20,
                    scoreMax: 80,
                    category: 'Soft Skills',
                    difficulty: 'Facile',
                    questions: [
                        '222d80322b814d6eac4e5ad5',
                        '222d80322b814d6eac4e5ad5',
                    ],
                    videoStart:
                        'https://www.youtube.com/watch?v=nXulsCU1geg&ab_channel=RyanReynolds',
                    videoEnd:
                        'https://www.youtube.com/watch?v=FQPlEnKav48&ab_channel=Fireship',
                    randomQuestions: true,
                    randomOrder: false,
                    enableScreenshots: false,
                    disableCopyPaste: false,
                    enableExposureLimit: true,
                    enableFeedback: true,
                    trainingQuestions: 2,
                    enableAdditionalTime: 20,
                });

            expect(response.status).toBe(400);
            expect(response.text).toBeDefined();
        });
    });
});
describe('DELETE /test', () => {
    describe('Delete a test', () => {
        it("Should respond with a 500 status code because the tests don't exist", async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c66'
            );
            expect(response.status).toEqual(204);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c60'
            );

            expect(response.status).toBe(204);
            expect(response.text).toBe('');
        });
    });
    describe('Delete a test', () => {
        it("Should respond with a 500 status code because the tests don't exist", async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c66'
            );
            expect(response.status).toEqual(204);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c60'
            );

            expect(response.status).toBe(204);
            expect(response.text).toBe('');
        });
    });
    describe('Delete a test', () => {
        it("Should respond with a 500 status code because the tests don't exist", async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c66'
            );
            expect(response.status).toEqual(204);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c60'
            );

            expect(response.status).toBe(204);
            expect(response.text).toBe('');
        });
    });
    describe('Delete a test', () => {
        it("Should respond with a 500 status code because the tests don't exist", async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c66'
            );
            expect(response.status).toEqual(204);
            expect(response.text).toBeDefined();
        });
        it('Should respond with a 204 status code and empty body', async () => {
            const response = await request.delete(
                '/api/v1/test/624ee1183ea24e35c3388c60'
            );

            expect(response.status).toBe(204);
            expect(response.text).toBe('');
        });
    });
});
