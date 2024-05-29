const { format } = require('date-fns');
const i18n = require('i18n');
/**
 * Groups and formats an array of evaluation history based on the date.
 *
 * @param {Object[]} evaluationHistory - An array of evaluation history steps.
 * @returns {Object} - An object with grouped evaluation history based on the date.
 *
 * @example
 * const exampleHistory = [
 *    { date: '2023-01-15T08:00:00Z', step: { _id: 'stepId1', name: 'Step 1' }, comment: 'Applied changes.' },
 *    { date: '2023-01-15T10:00:00Z', step: { _id: 'stepId2', name: 'Step 2' }, comment: 'Reviewed and approved.' },
 *    { date: '2023-01-16T09:30:00Z', step: { _id: 'stepId1', name: 'Step 1' }, comment: 'Reverted changes.' },
 *    // ... more history steps
 * ];
 * // Output:
 * // {
 * //    '15/01/2023': [
 * //       { date: '2023-01-15T10:00:00Z', step: { _id: 'stepId2', name: 'Step 2' }, comment: 'Reviewed and approved.' },
 * //       { date: '2023-01-15T08:00:00Z', step: { _id: 'stepId1', name: 'Step 1' }, comment: '<strong>Applied changes</strong>.' },
 * //    ],
 * //    '16/01/2023': [
 * //       { date: '2023-01-16T09:30:00Z', step: { _id: 'stepId1', name: 'Step 1' }, comment: 'Reverted changes.' },
 * //    ],
 * //    // ... more grouped history entries
 * // }
 */
const groupHistory = (evaluationHistory) => {
    const addOldValue = (steps) => {
        let previousValue = null;
        let previousName = null;

        return steps.map((step) => {
            const newStep = { ...step };
            if (previousValue !== step?.step?._id) {
                newStep.oldValue = previousName;
            }
            previousName = step?.step?.name;
            previousValue = step?.step?._id;

            if (!newStep.author) {
                newStep.author = {
                    firstName: i18n.__('Talenty ASSISTANT'),
                    lastName: '',
                };
                const position = newStep.comment.indexOf('applied');
                const namePart = newStep.comment.substring(0, position);
                const translatePart = newStep.comment.substring(position);
                newStep.comment = `<strong>${namePart}${i18n.__(
                    translatePart
                )}.</strong>`;
            }
            return newStep;
        });
    };
    let parsedHistory = addOldValue(
        evaluationHistory.sort((a, b) => new Date(a.date) - new Date(b.date))
    );
    parsedHistory = parsedHistory.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const newFormat = 'dd/MM/yyyy';

    return parsedHistory.reduce((acc, curr) => {
        const date = format(new Date(curr.date), newFormat);
        acc[date] = acc[date] ? [...acc[date], curr] : [curr];
        acc[date].sort((a, b) => new Date(b.date) - new Date(a.date));
        return acc;
    }, {});
};
module.exports = {
    groupHistory,
};
