const slugify = (text) => {
    // Replace French characters with their ASCII equivalent
    text = text
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[ç]/g, 'c')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[ñ]/g, 'n')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ýÿ]/g, 'y')
        .replace(/[^\w\s-]/g, '') // Remove non-word characters
        .trim() // Remove leading/trailing white space
        .toLowerCase(); // Convert to lowercase

    // Replace spaces with hyphens
    return text.replace(/\s+/g, '-');
};
const generateDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
};
const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
const detectLanguage = (text) => {
    const LanguageDetect = require('languagedetect');
    const lngDetector = new LanguageDetect();
    return lngDetector.detect(text, 1, ['en', 'fr'])[0][0];
};
module.exports = {
    slugify,
    generateDateString,
    capitalizeFirstLetter,
    detectLanguage,
};
