// Messages a student has to understand straight away (errors, backups, account rules,
// anything that deletes work) give the English first, then the French on the next line.
// The English stays first because this is still an English class. Lessons and button
// labels stay English-only; the French names a button the way the screen shows it, in « ».
export const bilingual = (english: string, french: string) => `${english}\n${french}`;
