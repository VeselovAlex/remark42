import type { User } from 'common/types';

import { getUser } from 'common/api';
import { authFetcher } from 'common/fetcher';

const EMAIL_SIGNIN_ENDPOINT = '/email/login';

export function anonymousSignin(user: string): Promise<User> {
  return authFetcher.get<User>('/anonymous/login', { user });
}

export function emailSignin(email: string, username: string): Promise<unknown> {
  return authFetcher.get(EMAIL_SIGNIN_ENDPOINT, { address: email, user: username });
}

/**
 * First step of two of `email` authorization
 *
 * @param username userrname
 * @param address email address
 */
export function verifyEmailSignin(token: string): Promise<User> {
  return authFetcher.get(EMAIL_SIGNIN_ENDPOINT, { token });
}

export function oauthSigninActor() {
  const REVALIDATION_TIMEOUT = 60 * 1000; // 1min
  let lastAttemptTime = Date.now();
  let authWindow: Window | null = null;

  (function userUpdater(): void {
    let currentRequest: Promise<User | null> | null = null;

    async function handleVisibilityChange(): Promise<void> {
      if (!authWindow?.closed) {
        console.log("auth haven't compleated");

        return;
      }

      if (!window.navigator.onLine) {
        console.log('offline');
        return;
      }

      if (document.hidden) {
        console.log('hidden');
        return;
      }

      if (currentRequest) {
        console.log('request in progress');
      }
      if (Date.now() - lastAttemptTime < REVALIDATION_TIMEOUT) {
        // console.log(Date.now() - lastAttemptTime - REVALIDATION_TIMEOUT);
        return;
      }

      const resetOnEnd = () => {
        currentRequest = null;
      };

      console.log('Try to revalidate user');
      currentRequest = getUser();
      currentRequest.then(resetOnEnd).catch(resetOnEnd);
      lastAttemptTime = Date.now();
    }

    handleVisibilityChange();
    window.addEventListener('visibilitychange', handleVisibilityChange);
  })();

  return function oauthSignin(url: string) {
    authWindow = window.open(url);
    lastAttemptTime = Date.now();
  };
}

export function logout(): Promise<void> {
  return authFetcher.get('/logout');
}
