module.exports = {
  bestsuccess: require('./bestsuccess.mp3'),
  bigsuccess: require('./bigsuccess.mp3'),
  success: require('./success.mp3'),
  embarrassed: require('./embarrassed.png'),
  good: require('./good.png'),
  shootingStar: require('./shooting-star.png'),
  timerFire: require('./Timerfire.png'),
  comic: { uri: 'https://nabdgzjpwhkjfimljnql.supabase.co/storage/v1/object/public/project_assets/3f73cf2e-d5b9-47d9-9c63-a27ee6adfbf4/assets/d38eee9f-de88-442d-b8b1-c385b9413edd_comic.png' },
  // Lesson thumbnails - prefer local bundled files (require) for offline rendering
  lessonThumbnails: (function(){
    const raw = {
      'Activities': require('./thumbnails/activities thumbnail.png'),
      'American Dishes': require('./thumbnails/American dishes thumbnail.png'),
      'Animals': require('./thumbnails/animals thumbnail.png'),
      'Body': require('./thumbnails/body thumbnail.png'),
      'Breakfast': require('./thumbnails/breakfast thumbnail.png'),
      'Bullying': require('./thumbnails/bullying thumbnail.png'),
      'Cinema': require('./thumbnails/cinema thumbnail.png'),
      'City Travel': require('./thumbnails/city travel thumbnail.png'),
      'Classroom English': require('./thumbnails/classroom english thumbnail.png'),
      'Clothes': require('./thumbnails/clothes thumbnail.png'),
      'Colours': require('./thumbnails/Colours thumbnail.png'),
      'Cooking': require('./thumbnails/cooking thumbnail.png'),
      'Daily Questions': require('./thumbnails/Daily questions thumbnail.png'),
      'Daily Routine': require('./thumbnails/Daily routine thumbnail.png'),
      'Date': require('./thumbnails/Date thumbnail.png'),
      'Describing a picture': require('./thumbnails/describing thumbnail.png'),
      'Detective': require('./thumbnails/detective stories thumbnail.png'),
      'Ecology': require('./thumbnails/ecology thumbnail.png'),
      'Emotions': require('./thumbnails/emotions easy thumbnail.png'),
      'Emotions +': require('./thumbnails/emotions level 2 thumbnail.png'),
      'Family': require('./thumbnails/family thumbnail.png'),
      'Food Basics': require('./thumbnails/Food basics thumbnail.png'),
      'Tastes': require('./thumbnails/Likes thumbnail.png'),
      'Frequency Adverbs': require('./thumbnails/Frequency thumbnail.png'),
      'Furniture': require('./thumbnails/furniture thumbnail.png'),
      'Geography': require('./thumbnails/geography thumbnail.png'),
      'Getting a job': require('./thumbnails/Getting a job thumbnail.png'),
      'House': require('./thumbnails/house thumbnail.png'),
      'Instructions': require('./thumbnails/instructions thumbnail.png'),
      'Job examples': require('./thumbnails/job examples thumbnail.png'),
      'Legends': require('./thumbnails/legends thumbnail.png'),
      'Likes': require('./thumbnails/Likes thumbnail.png'),
      'Location': require('./thumbnails/Location thumbnail.png'),
      'Love': require('./thumbnails/love thumbnail.png'),
      'Nationality': require('./thumbnails/nationality thumbnail.png'),
      'Opinion Basics': require('./thumbnails/opinion level 1 thumbnail.png'),
      'Opinion +': require('./thumbnails/opinion level 2 thumbnail.png'),
      'Emotions +': require('./thumbnails/emotions level 2 thumbnail.png'),
      'Personality Basics': require('./thumbnails/personality thumbnail.png'),
      'Personality+': require('./thumbnails/personality thumbnail.png'),
      'Personality +': require('./personality + thumbnail.png'),
      'Physical Description': require('./thumbnails/physical description thumbnail.png'),
      'Question Words': require('./thumbnails/question words thumbnail.png'),
      'Robots': require('./thumbnails/robot thumbnail.png'),
      'School Basics': require('./thumbnails/school basics thumbnail.png'),
      'School Life': require('./thumbnails/school life thumbnail.png'),
      'School life': require('./thumbnails/school life thumbnail.png'),
      'Segregation': require('./thumbnails/segregation thumbnail.png'),
      'Space': require('./thumbnails/space thumbnail.png'),
      'The Internet': require('./thumbnails/the internet thumbnail.png'),
      'The UK': require('./thumbnails/The uk and ireland thumbnail.png'),
      'Time': require('./thumbnails/Time thumbnail.png'),
      'Video Game Actions': require('./thumbnails/video game actions thumbnail.png'),
      'Video Games': require('./thumbnails/videogames thumbnail.png'),
      // Aliases and additional mappings for lesson title variants
      // 'Dystopia' removed per request
      'Jobs': require('./thumbnails/job examples thumbnail.png'),
      'Internet': require('./thumbnails/the internet thumbnail.png'),
      'Opinion': require('./thumbnails/opinion level 1 thumbnail.png'),
      // Prefer a local thumbnail if present; we also allow a remote URI fallback.
      'Types of documents': require('./typesdocs thumbnail.png'),
      'Types of Documents': require('./typesdocs thumbnail.png'),
      'Types-of-documents': require('./typesdocs thumbnail.png'),
      'Video game powers': require('./thumbnails/video game actions thumbnail.png'),

      // Map Extreme sports to the main assets folder thumbnail
      'Extreme sports': require('./extreme sports thumbnail.png'),
      'Extreme Sports': require('./extreme sports thumbnail.png'),
      'Extreme-Sports': require('./extreme sports thumbnail.png'),

      // New lesson
      'The Blitz': require('./blitzthumbnail.png'),
    };

    const mapped = {};
    Object.keys(raw).forEach(k => {
      const v = raw[k];
      if (typeof v === 'string' && v.startsWith('http')) mapped[k] = { uri: v };
      else mapped[k] = v;
    });
    return mapped;
  })()
};