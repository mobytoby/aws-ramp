import { Component, OnInit } from '@angular/core';
import { Auth } from 'aws-amplify';
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
    Auth.currentAuthenticatedUser({
      bypassCache: false
    }).then(async user => {
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
    .catch(err => console.log(err));
  }

}
