const inputsTranslation = {
    name: 'Le champ nom',
    email: 'Le champ adresse mail',
    password: 'Le champ mot de passe',
    roleName: 'Le champ nom du rôle',
    type: 'Le champ type',
    category: 'Le champ catégorie',
    difficulty: 'Le champ difficulté',
    applyPenalty: 'Le champ penalité',
    answers: 'Le champ réponses',
    allowedTime: 'Le champ temps alloué',
    description: 'Le champ description',
    params: 'Le champ paramètres',
    id: 'Le champ id',
    scoreMin: 'Le champ score min',
    scoreMax: 'Le champ score max',
    questions: 'Le champ questions',
    videoStart: 'Le champ video de début',
    videoEnd: 'Le champ video de fin',
    randomQuestions: 'Le champ questions aléatoires  ',
    randomOrder: 'Le champ ordre des questions aléatoires',
    enableScreenshots: 'Le champ captures webcam aléatoires',
    disableCopyPaste: 'Le champ copier-coller désactivé',
    enableExposureLimit: "Le champ alertes de limite d'exposition",
    enableFeedback: 'Le champ feedback à la fin du test',
    trainingQuestions: "Le champ questions d'entrainement",
    enableAdditionalTime:
        'Le champ temps supplémentaire pour les candidats avec une capacité de concentration ou de mémoire',
};

const parseErrors = (errors) => {
    errors.forEach((err) => {
        switch (err.code) {
            case 'invalid':
                err.message = `${err.local.key} n'est pas valide`;
                break;
            case 'object.unknown':
                err.message = `${err.local.key} n'est pas autorisé`;
                break;
            case 'array.base':
                err.message = `${err.local.key} doit être un tableau`;
                break;
            case 'number.base':
                err.message = `${err.local.key} doit être un nombre`;
                break;
            case 'string.base':
                err.message = `${err.local.key} doit être de type texte`;
                break;
            case 'boolean.base':
                err.message = `${err.local.key} doit être de type boolean`;
                break;
            case 'string.empty':
            case 'any.required':
                err.message = `${err.local.key} est obligatoire`;
                break;
            case 'string.alphanum':
                err.message = `${err.local.key} doit être alphanumérique`;
                break;
            case 'string.min':
            case 'number.min':
                err.message = `${err.local.key} doit contenir au minimum ${err.local.limit} caractères`;
                break;
            case 'array.min':
                err.message = `${err.local.key} doit contenir au minimum ${err.local.limit} champs`;
                break;
            case 'string.max':
            case 'number.max':
                err.message = `${err.local.key} doit contenir au maximum ${err.local.limit} caractères`;
                break;
            case 'array.max':
                err.message = `${err.local.key} doit contenir au maximum ${err.local.limit} champs`;
                break;
            case 'string.email':
                err.message = `${err.local.key} doit être une adresse email valide`;

                break;
            default:
                break;
        }
    });
    return errors;
};
module.exports = { parseErrors };
