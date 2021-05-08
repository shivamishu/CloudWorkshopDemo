sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("aws.LightningStorage.controller.Welcome", {
      onInit: function () {
        this._oRouter = this.getOwnerComponent().getRouter();
      },
      onAfterRendering: function () {
        // $("#splash-screen").remove();
      },
      handleCognito: function () {
        this._oRouter.navTo("welcome", {}, false);
        // var sUrl =
        //   "https://rightfinder.auth.us-west-1.amazoncognito.com/login?client_id=tv98hvjqg6q2bubao0gqte446&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https://master.d1l8csbyyor94c.amplifyapp.com/";
        // sap.m.URLHelper.redirect(sUrl, false);
      },
    });
  }
);
