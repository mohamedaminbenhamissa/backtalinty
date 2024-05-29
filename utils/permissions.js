const { AbilityBuilder, Ability } = require('@casl/ability');

const roleRules = (can, permissions) => {
    for (const [key, value] of Object.entries(permissions)) {
        if (value.includes('C')) can('create', key);
        if (value.includes('R')) can('read', key);
        if (value.includes('U')) can('update', key);
        if (value.includes('D')) can('delete', key);
    }
};

const defineRulesFor = (role) => {
    const { can, rules } = new AbilityBuilder(Ability);

    roleRules(can, role);

    return rules;
};

const buildAbilityFor = (permissions) => {
    if (permissions) {
        return new Ability(defineRulesFor(permissions));
    } else {
        return new Ability(defineRulesFor({}));
    }
};
const methodToAction = (method) => {
    switch (method.toUpperCase()) {
        case 'GET':
            return 'read';
        case 'POST':
            return 'create';
        case 'PUT':
        case 'PATCH':
            return 'update';
        case 'DELETE':
            return 'delete';
        default:
            return null;
    }
};
const pathToSubject = (path) => {
    return path.split('/')[3].split('?')[0];
};
module.exports = { buildAbilityFor, methodToAction, pathToSubject };
