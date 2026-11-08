const video = (id, title) => ({
  id,
  title,
  src: `/assets/videos/${id}.mp4`,
  poster: `/assets/videos/${id}.jpg`,
  captions: `/assets/videos/${id}.vtt`,
});

export const videos = {
  intro: video('flint-intro', 'Meet Flint'),
  howFlintWorks: video('how-flint-works', 'How Flint works'),
  couleePowerKickoff: video('coulee-power-kickoff', 'Kickoff with Avery'),
  airbnbKickoff: video('airbnb-kickoff', 'Kickoff with Jordan'),
  shopifyKickoff: video('shopify-kickoff', 'Kickoff with Erik'),
  poolPrice: video('pool-price-explained', 'What is a pool price?'),
};
