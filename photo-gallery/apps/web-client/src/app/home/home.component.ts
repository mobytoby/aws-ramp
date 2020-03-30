import { Component, OnInit } from '@angular/core';
import { Auth, Storage } from 'aws-amplify';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  router: Router;
  userName = '';
  userId = '';

  ngOnInit() {
    // Auth.currentUserInfo()
    // .then(async foo => {
    //   console.log('Current User', foo);
    // });
    Auth.currentAuthenticatedUser({
      bypassCache: false
    }).then(async user => {
      // Storage.list('image', { level: 'private' })
      // .then(val => console.log('Storage:', val));
      // console.log(user);
      this.userId = user.attributes.sub;
      this.userName = user.username;
    })
    .catch(err => console.error(err));
  }

  logOut() {
    Auth.signOut({ global: true })
    .then(() => {
      this.router.navigate(['/auth']);
    })
    .catch(err => console.error(err));
  }

}
