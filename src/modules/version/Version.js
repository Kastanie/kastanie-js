import { AppComponent } from "../../app/AppComponent.js";

export class Version extends AppComponent {
  init() {
    this.data = window.app.build;
  }
}
