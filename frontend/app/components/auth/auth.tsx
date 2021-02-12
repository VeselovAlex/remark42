import { h, Fragment, FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useIntl, FormattedMessage, MessageDescriptor } from 'react-intl';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';

import type { OAuthProvider, User } from 'common/types';
import { signin } from 'store/user/actions';
import Button from 'components/button';

import messages from './auth.messsages';
import { useDropdown } from './auth.hooks';
import { anonymousSignin, emailSignin, oauthSigninActor, verifyEmailSignin } from './auth.api';
import { getProviders, getTokenInvalidReason, getEmailInvalidReason, getUsernameInvalidReason } from './auth.utils';
import InputField from './components/input-field';
import OAuthButton from './components/oauth-button';

import styles from './auth.module.css';

type OAuthProvidersProps = {
  providers: OAuthProvider[];
};

function getButtonVariant(num: number) {
  if (num === 2) {
    return 'name';
  }

  if (num === 1) {
    return 'full';
  }

  return 'icon';
}

const oauthSignin = oauthSigninActor();

const OAuthProviders: FunctionComponent<OAuthProvidersProps> = ({ providers }) => {
  const buttonVariant = getButtonVariant(providers.length);
  const handleOathClick = (evt: MouseEvent) => {
    const { href } = evt.currentTarget as HTMLAnchorElement;

    evt.preventDefault();
    oauthSignin(href);
  };

  return (
    <>
      <h5 className={styles.title}>Use Social Network</h5>
      <ul className={classnames(styles.oauth)}>
        {providers.map((p) => (
          <li className={classnames(styles.oauthItem)}>
            <OAuthButton provider={p} onClick={handleOathClick} variant={buttonVariant} />
          </li>
        ))}
      </ul>
    </>
  );
};

const Auth: FunctionComponent = () => {
  const intl = useIntl();
  const dispath = useDispatch();

  const [oauthProviders, formProviders] = getProviders();
  // State of UI
  const [isLoading, setLoading] = useState(false);
  const [showTokenStep, setShowTokenStep] = useState(false);
  const [active, setActive] = useState(formProviders[0]);
  const [ref, isDropdownShowed, toggleDropdownState] = useDropdown(showTokenStep);
  // Field values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  // Errors
  const [invalidReason, setInvalidReason] = useState<MessageDescriptor | null>(null);
  const [emailInvalidReason, setEmailInvalidReason] = useState<MessageDescriptor | null>(null);
  const [tokenInvalidReason, setTokenInvalidReason] = useState<MessageDescriptor | null>(null);
  const [usernameInvalidReason, setUsernameInvalidReason] = useState<MessageDescriptor | null>(null);

  const handleProviderChange = (evt: Event) => {
    const { value } = evt.currentTarget as HTMLInputElement;

    setInvalidReason(null);
    setUsernameInvalidReason(null);
    setEmailInvalidReason(null);
    setActive(value as typeof formProviders[number]);
  };

  const handleUsernameChange = (evt: Event) => {
    const { value } = evt.currentTarget as HTMLInputElement;

    setInvalidReason(null);
    setUsernameInvalidReason(null);
    setUsername(value);
  };

  const handleEmailChange = (evt: Event) => {
    const { value } = evt.currentTarget as HTMLInputElement;

    setInvalidReason(null);
    setEmailInvalidReason(null);
    setEmail(value);
  };

  const handleTokenChange = (evt: Event) => {
    const { value } = evt.currentTarget as HTMLInputElement;

    setInvalidReason(null);
    setTokenInvalidReason(null);
    setToken(value);
  };

  const handleSubmit = async (evt: Event) => {
    evt.preventDefault();

    let errors = false;

    if (showTokenStep) {
      const tokenInvalidReason = getTokenInvalidReason(token);

      if (tokenInvalidReason) {
        setTokenInvalidReason(tokenInvalidReason);
        errors = true;
      }
    }

    if (active === 'email') {
      const emailInvalidReason = getEmailInvalidReason(email);

      if (emailInvalidReason) {
        setEmailInvalidReason(emailInvalidReason);
        errors = true;
      }
    }

    const usernameInvalidReason = getUsernameInvalidReason(username);

    if (usernameInvalidReason) {
      setUsernameInvalidReason(usernameInvalidReason);
      errors = true;
    }

    if (errors) {
      return;
    }

    setLoading(true);
    try {
      let user: User | null = null;

      if (showTokenStep) {
        user = await verifyEmailSignin(token);
      }
      if (active === 'email') {
        await emailSignin(email, username);
        setShowTokenStep(true);
      } else {
        user = await anonymousSignin(username);
      }

      if (user) {
        dispath(signin(user));
      }
    } catch (e) {
      setInvalidReason(messages.unexpectedError);
    }
    setLoading(false);
  };

  const handleShowLoginStep = (evt: Event) => {
    evt.preventDefault();

    setToken('');
    setShowTokenStep(false);
  };

  const hasOAuthProviders = oauthProviders.length > 0;
  const hasFormProviders = formProviders.length > 0;
  const buttonLabel = showTokenStep ? 'Verify' : 'Submit';

  return (
    <div className={classnames('auth-panel', styles.root)} ref={ref}>
      <button
        className={classnames(styles.button, { [styles.buttonActive]: isDropdownShowed })}
        onClick={toggleDropdownState}
      >
        <FormattedMessage id="auth.signin" defaultMessage="Sign In" />
      </button>
      <div className={classnames(styles.dropdown, { [styles.dropdownShow]: isDropdownShowed })}>
        <form className={classnames('signin-form', styles.form)} onSubmit={handleSubmit}>
          {showTokenStep ? (
            <>
              <Button onClick={handleShowLoginStep}>Back</Button>
              <InputField
                type="textarea"
                name="token"
                value={token}
                onInput={handleTokenChange}
                placeholder={intl.formatMessage(messages.token)}
                errorMessage={tokenInvalidReason !== null && intl.formatMessage(tokenInvalidReason)}
                disabled={isLoading}
              />
            </>
          ) : (
            <>
              {hasOAuthProviders && <OAuthProviders providers={oauthProviders} />}
              {hasOAuthProviders && hasFormProviders && <div className={styles.divider} title="or" />}
              {formProviders.length === 1 ? (
                <h5 className={styles.title}>{formProviders[0]}</h5>
              ) : (
                <div className={styles.tabs}>
                  {formProviders.map((p) => (
                    <label key={p} className={styles.provider}>
                      <input
                        className={styles.radio}
                        type="radio"
                        name="form-provider"
                        value={p}
                        onChange={handleProviderChange}
                        checked={p === active}
                      />
                      <span className={styles.providerName}>{p.slice(0, 6)}</span>
                    </label>
                  ))}
                </div>
              )}
              <InputField
                name="username"
                value={username}
                onInput={handleUsernameChange}
                placeholder={intl.formatMessage(messages.username)}
                errorMessage={usernameInvalidReason !== null && intl.formatMessage(usernameInvalidReason)}
                disabled={isLoading}
              />
              {active === 'email' && (
                <InputField
                  name="email"
                  value={email}
                  onInput={handleEmailChange}
                  placeholder={intl.formatMessage(messages.emailAddress)}
                  errorMessage={emailInvalidReason !== null && intl.formatMessage(emailInvalidReason)}
                  disabled={isLoading}
                />
              )}
            </>
          )}
          <input className={styles.honeypot} type="checkbox" tabIndex={-1} autoComplete="off" />
          {invalidReason !== null && <div className={styles.error}>{intl.formatMessage(invalidReason)}</div>}
          <Button
            type="submit"
            kind="primary"
            size="large"
            mix={styles.submit}
            title={isLoading ? 'Loading...' : buttonLabel}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : buttonLabel}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
