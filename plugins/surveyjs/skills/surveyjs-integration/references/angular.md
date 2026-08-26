# Angular

## Install

```bash
npm install survey-angular-ui
```

`survey-core` arrives as a transitive dependency. Requires **Angular v12 or newer** and
`@angular/cdk` — install the CDK if the app does not already have it:

```bash
npm install @angular/cdk
```

## Stylesheet

Add it to `angular.json` so it loads once for the whole app:

```json
"styles": [
  "src/styles.css",
  "node_modules/survey-core/survey-core.css"
]
```

Standalone-only apps can instead import it in the component file:

```ts
import "survey-core/survey-core.css";
```

Pick one. Doing both ships the stylesheet twice.

## Register the module

**NgModule apps** — `app.module.ts`:

```ts
import { SurveyModule } from "survey-angular-ui";

@NgModule({
  imports: [BrowserModule, SurveyModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

**Standalone components** — add `SurveyModule` to the component's own `imports`:

```ts
@Component({
  selector: "app-survey",
  standalone: true,
  imports: [SurveyModule],
  templateUrl: "./survey.component.html"
})
export class SurveyPageComponent {}
```

`SurveyModule` is the only import needed; it exports every question component.

## Component

```ts
import { Component, OnInit } from "@angular/core";
import { Model } from "survey-core";

const surveyJson = {
  elements: [
    { name: "FirstName", title: "Enter your first name:", type: "text" },
    { name: "LastName", title: "Enter your last name:", type: "text" }
  ]
};

@Component({
  selector: "app-survey",
  templateUrl: "./survey.component.html"
})
export class SurveyPageComponent implements OnInit {
  surveyModel!: Model;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const survey = new Model(surveyJson);
    survey.onComplete.add((sender, options) => {
      options.showSaveInProgress();
      this.http.post("/api/survey-results", sender.data).subscribe({
        next: () => options.showSaveSuccess(),
        error: () => options.showSaveError("Could not save your answers.")
      });
    });
    this.surveyModel = survey;
  }
}
```

Template:

```html
<survey [model]="surveyModel"></survey>
```

The selector is `survey`, and `model` is its only input. A popup variant is available as
`<popup-survey [model]="surveyModel">`.

## Build the model in `ngOnInit`, not in the template

A getter or a method call bound into the template re-runs on every change-detection cycle and
produces a new model each time, wiping answers as the respondent types:

```html
<!-- WRONG — new model on every change detection -->
<survey [model]="buildModel()"></survey>
```

Assign it once to a field, as above.

## Zone.js and OnPush

SurveyJS mutates its model outside Angular's change detection in some flows. With
`ChangeDetectionStrategy.OnPush` on the host component, mark for check from a model event:

```ts
survey.onValueChanged.add(() => this.cdr.markForCheck());
```

Default change detection needs nothing extra.

## Loading a schema from the backend

```ts
ngOnInit() {
  this.http.get(`/api/forms/${this.formId}`).subscribe((json) => {
    this.surveyModel = new Model(json);
  });
}
```

Guard the template so it does not render before the model exists:

```html
<survey *ngIf="surveyModel" [model]="surveyModel"></survey>
```

## SSR (Angular Universal / `@angular/ssr`)

Form Library v3 renders on the server, so no `isPlatformBrowser` guard is needed around
`<survey>`. Two rules keep hydration stable:

- Build the model from a schema that is identical on the server and the client. With
  `HttpClient` that means `TransferState` (`provideClientHydration(withHttpTransferCacheOptions(...))`),
  so the client reuses the server's response instead of refetching a different one.
- Do not read `window`, `document`, or `localStorage` in the constructor or `ngOnInit`; move
  that into `ngAfterViewInit` or an event handler.

**On v2 and earlier** the library is browser-only: keep the render behind `isPlatformBrowser`.

## More

Framework-specific source for any demo:
`https://surveyjs.io/form-library/examples/<name>/angular.md`
