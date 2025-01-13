import { GenericOAuth2 } from '@capacitor-community/generic-oauth2';

@Component({
  template:
    '<button (click)="onOAuthBtnClick()">Login with OAuth</button>' +
    '<button (click)="onOAuthRefreshBtnClick()">Refresh token</button>' +
    '<button (click)="onLogoutClick()">Logout OAuth</button>',
})
export class SignupComponent {
  accessToken;
  refreshToken;

  onOAuthBtnClick() {
    GenericOAuth2.authenticate()
      .then(response => {
        this.accessToken = response['access_token']; // storage recommended for android logout
        this.refreshToken = response['refresh_token'];

        // only if you include a resourceUrl protected user values are included in the response!
        // let oauthUserId = response['id'];
        // let name = response['name'];

        // go to backend
      })
      .catch(reason => {
        console.error('OAuth rejected', reason);
      });
  }

  // Refreshing tokens only works on iOS/Android for now
  onOAuthRefreshBtnClick() {
    if (!this.refreshToken) {
      console.error('No refresh token found. Log in with OAuth first.');
    }

    GenericOAuth2.refreshToken(oauth2RefreshOptions)
      .then(response => {
        this.accessToken = response['access_token']; // storage recommended for android logout
        // Don't forget to store the new refresh token as well!
        this.refreshToken = response['refresh_token'];
        // Go to backend
      })
      .catch(reason => {
        console.error('Refreshing token failed', reason);
      });
  }

  onLogoutClick() {
    GenericOAuth2.logout(
      oauth2LogoutOptions,
      this.accessToken, // only used on android
    )
      .then(() => {
        // do something
      })
      .catch(reason => {
        console.error('OAuth logout failed', reason);
      });
  }
}