const axios = require('axios');
require('dotenv').config();

const getCalendarEvents = async (req, res) => {
    try {
        const User = req.User;
        const Candidate = req.Candidate;
        const accessToken = process.env.CALENDLY_ACCESS_TOKEN;
        const organizationUrl = process.env.CALENDLY_ORGANIZATION_URL;
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };
        const scheduledEventsUrl = `https://api.calendly.com/scheduled_events`;
        var options = {
            method: 'GET',
            url: scheduledEventsUrl,
            params: {
                organization: organizationUrl,
                count: '100',
            },
            headers: headers,
        };
        const scheduledEventsResponse = await axios.request(options);

        const events = scheduledEventsResponse.data.collection;
        const stateEvents = events.map((event) => {
            const { end_time, start_time, name, status, uri, location } = event;

            const currentDate = new Date();
            const eventEndDate = new Date(end_time);

            const isPassed = eventEndDate < currentDate;
            const isAvailable = status === 'active';
            const isNotCanceled = status !== 'canceled';

            let color;
            let classNames = [];
            if (isPassed && isAvailable && isNotCanceled) {
                color = '#3f51b5';
            } else if (status === 'canceled') {
                color = '#f44336';
                classNames.push('fc-event-canceled');
            } else {
                color = '#43a048';
            }

            const processedEvent = {
                end: end_time,
                start: start_time,
                eventName: name,
                description: status,
                id: uri,
                join_url: location.join_url,
                type: location.type,
                color: color,
                textColor: '#ffffff',
                classNames: classNames.join(' '),
            };

            return processedEvent;
        });

        // Get EventsInvitees for each event
        const eventsInviteesPromises = events.map(async (event) => {
            const eventId = event.uri;
            const eventsInviteesUrl = `${eventId}/invitees`;
            const eventsInviteesResponse = await axios.get(eventsInviteesUrl, {
                headers: headers,
            });
            const inviteesData = eventsInviteesResponse.data.collection;

            // Apply new format logic to each invitee
            const processedInvitees = inviteesData.map((invitee) => {
                const { email, questions_and_answers, event, cancellation } =
                    invitee;
                const cancellationBy = !!cancellation?.canceled_by;
                return {
                    eventId: event,
                    invitee_email: email,
                    meeting_Subject: questions_and_answers[0]?.answer,
                    cancellation: cancellationBy,
                    cancellation_reason: cancellation?.reason,
                };
            });

            return processedInvitees;
        });

        const eventsInvitees = await Promise.all(eventsInviteesPromises);
        const invitees = eventsInvitees.flat();

        const inviteEmails = invitees.map((el) => el.invitee_email);

        const inviteesInfo = await Candidate.aggregate([
            {
                $match: { email: { $in: Array.from(inviteEmails) } },
            },
            {
                $project: {
                    candidateName: {
                        $concat: ['$firstName', ' ', '$lastName'],
                    },
                    candidateEmail: '$email',
                    candidateId: '$_id',
                    candidateType: 'candidate',
                    _id: 0,
                },
            },
        ]);
        if (inviteEmails.size === inviteesInfo.length) {
            return inviteesInfo;
        }
        const foundEmails = inviteesInfo.map(
            (invitee) => invitee.candidateEmail
        );
        const notFoundEmails = Array.from(inviteEmails).filter(
            (email) => !foundEmails.includes(email)
        );

        if (notFoundEmails.length > 0) {
            const missingInviteesInfo = await User.aggregate([
                {
                    $match: { email: { $in: notFoundEmails } },
                },
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'role',
                        foreignField: '_id',
                        as: 'role',
                    },
                },
                {
                    $project: {
                        candidateName: {
                            $concat: ['$firstName', ' ', '$lastName'],
                        },
                        candidateEmail: '$email',
                        candidateId: '$_id',
                        candidateType: { $arrayElemAt: ['$role.roleName', 0] },
                        _id: 0,
                    },
                },
            ]);

            inviteesInfo.push(...missingInviteesInfo);
        }

        const mergedEvents = await Promise.all(
            stateEvents.map(async (event) => {
                const eventInvitees = invitees.filter(
                    (invitee) => invitee.eventId === event.id
                );
                const title = eventInvitees.map((eventInvitee) => {
                    const inviteeInfo = inviteesInfo.find(
                        (info) =>
                            info.candidateEmail === eventInvitee.invitee_email
                    );
                    return inviteeInfo ? inviteeInfo.candidateName : null;
                });
                const eventInviteesInfo = eventInvitees.map((eventInvitee) => {
                    const inviteeInfo = inviteesInfo.find(
                        (info) =>
                            info.candidateEmail === eventInvitee.invitee_email
                    );
                    return inviteeInfo
                        ? {
                              ...inviteeInfo,
                              meeting_Subject: eventInvitee.meeting_Subject,
                              cancellation: eventInvitee.cancellation,
                              cancellation_reason:
                                  eventInvitee.cancellation_reason,
                          }
                        : null;
                });

                return {
                    ...event,
                    title,
                    inviteesInfo: eventInviteesInfo,
                };
            })
        );

        return res.status(200).json(mergedEvents);
    } catch (error) {
        return res.status(500).send('Error: ' + error.message);
    }
};

module.exports = getCalendarEvents;
