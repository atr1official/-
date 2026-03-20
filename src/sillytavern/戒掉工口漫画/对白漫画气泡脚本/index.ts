import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';

$(() => {
  const { unmount } = mountStreamingMessages(() => createApp(App), {
    host: 'div',
    keep_last_n: 2,
  });
  $(window).on('pagehide', () => unmount());
});
