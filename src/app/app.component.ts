import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,  // ✅ Important !
  imports: [RouterOutlet], // ✅ Permet d'afficher les routes
  template: `<router-outlet></router-outlet>`, // ✅ Pour afficher les composants selon les routes
})

export class AppComponent {
  title = 'lunflowFront';
}

