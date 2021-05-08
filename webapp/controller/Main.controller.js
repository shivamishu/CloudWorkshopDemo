sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat",
  ],
  function (Controller, JSONModel, MessageToast, Fragment, DateFormat) {
    "use strict";
    
    return Controller.extend("aws.LightningStorage.controller.Main", {
      onInit: function () {
        this._oView = this.getView();
        this._oRouter = this.getOwnerComponent().getRouter();
        var oMainModel = new JSONModel({
          busy: true,
          busyUpload: false,
          delay: 0,
          items: [],
          employee: {},
          photoSuccess: false,
          photoError: false,
          photoMsg: "Photo uploaded successfully",
          totalEmployees: "",
          mimeType: ["image/png", "image/jpeg"],
        });
        
        this._oView.setModel(oMainModel, "mainModel");
        this._oRouter
          .getRoute("welcome")
          .attachPatternMatched(this._onRouteMatched, this);
 
      },
     
      
      _onRouteMatched: function () {
        if (this._refresh) {
          this._refresh = false;
          jQuery.sap.delayedCall(1000, this, this._initOverviewModelBinding);
        }
      },
      
      attachControl: function (oControl) {
        var sCompactCozyClass = this.getOwnerComponent().getContentDensityClass();
        jQuery.sap.syncStyleClass(sCompactCozyClass, this.getView(), oControl);
        this.getView().addDependent(oControl);
      },

      
    
      sendBase64String: function (sBase64String, fileSize, mimeType, fileName, oFileUploader) {

        // var sBase64String = await toBase64(oFile);
        var data = {
          filename: fileName,
          base64String: sBase64String,
          mimeType: mimeType,
          fileSize: fileSize
        }
        var oMainModel = this.getView().getModel("mainModel");
        oFileUploader.setBusy(true);
        $.ajax({
          type: "POST",
          headers: {
            Authorization: `Bearer ${window.sessionStorage.accessToken}`,
          },
          contentType: "application/json",
          url: "https://jr3pu77ofi.execute-api.us-west-1.amazonaws.com/uploadToS3",
          dataType: "json",
          data: JSON.stringify(data),
          success: function (data) {
            this.callDetectObjects(data.filePath);
            oFileUploader.setBusy(false);
            oMainModel.setProperty("/photo_url", data.url);
            oFileUploader.setValue(null);
            oMainModel.setProperty(
              "/photoMsg",
              "Photo Uploaded Successfully"
            );
            oMainModel.setProperty("/photoSuccess", true);
            oMainModel.setProperty("/photoError", false);
            oMainModel.setProperty("/busyUpload", false);
          }.bind(this),
          error: function (error) {
            oFileUploader.setBusy(false);
            oMainModel.setProperty(
              "/photoMsg",
              "An error occurred. Please retry."
            );
            oMainModel.setProperty("/photoError", true);
            oMainModel.setProperty("/photoSuccess", false);
            oMainModel.setProperty("/busyUpload", false);
            console.log("Error fetching files");
          }.bind(this),
        });
      },
      callDetectObjects: function(sFile){
        var oMainModel = this.getView().getModel("mainModel");
        // var data = {fileName: sFile,
        //             mode: "OBJECTS"};
        oMainModel.setProperty("/labelBusy", true);
        $.ajax({
          type: "GET",
          headers: {
            Authorization: `Bearer ${window.sessionStorage.accessToken}`,
          },
          contentType: "application/json",
          url: `https://j8mtfr7at5.execute-api.us-west-1.amazonaws.com/findObjects?fileName=${sFile}&mode=OBJECTS`,
          dataType: "json",
          success: function (data) {
            oMainModel.setProperty("/labelBusy", false);
            oMainModel.setProperty("/items", data.Labels);
          }.bind(this),
          error: function (error) {
            oMainModel.setProperty("/labelBusy", false);
            console.log("Error fetching files");
          }.bind(this),
        });

      },
      handleUploadPress: function (oEvent) {
        var oFileUploader = this._oView.byId("fileUploader"),
          oFile = oFileUploader.oFileUpload.files[0];

        const fileSize = oFile.size; //updated size
        const mimeType = oFile.type;
        const fileName = oFile.name;
        if (oFile) {
          const toBase64 = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(oFile);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
          toBase64.then(value => {
            this.sendBase64String(value, fileSize, mimeType, fileName, oFileUploader);
          });
        } else {
          MessageToast.show("Please choose a file to uploaded");
        }
      },
    
      onFileDeleted: function (oEvent) {
        var sDocId = oEvent.getParameter("documentId"),
          oMainModel = this._oView.getModel("mainModel"),
          aItems = oMainModel.getProperty("/items");

        // var sUserId = "s.s@gmail.com";
        var data = {
          // user_id: sUserId,
          filename: oEvent.getParameter("documentId"),
        };
        oMainModel.setProperty("/busyDelete", true);
        $.ajax({
          type: "DELETE",
          headers: {
            Authorization: `Bearer ${window.sessionStorage.accessToken}`,
          },
          contentType: "application/json",
          url: "/api/delete_file",
          crossDomain: true,
          dataType: "json",
          data: JSON.stringify(data),
          success: function (data) {
            jQuery.each(aItems, function (index) {
              if (aItems[index] && aItems[index].filename === sDocId) {
                aItems.splice(index, 1);
              }
            });
            oMainModel.setProperty("/items", aItems);
            oMainModel.setProperty("/busyDelete", false);
            MessageToast.show("File deleted successfully");
          }.bind(this),
          error: function (error) {
            oMainModel.setProperty("/busyDelete", false);
            console.log("Error fetching files");
          }.bind(this),
        });
      },
      onEmail: function (oEvent) {
        var sValue = oEvent.getSource().getText();
        sap.m.URLHelper.triggerEmail(sValue);
      },
      onPhone: function (oEvent) {
        var sValue = oEvent.getSource().getText();
        sap.m.URLHelper.triggerTel(sValue);
      },
      onFileSizeExceed: function (oEvent) {
        MessageToast.show("Max. 10 MB size allowed");
      },
     
      formatFilename: function (fileName) {
        var sFileName = fileName;
        if (fileName) {
          var strtInx = fileName.indexOf("-");
          sFileName = fileName.substr(strtInx + 1);
        }
        return sFileName;
      },
      formatTime: function (time) {
        var sTimestamp = "";
        if (time) {
          var timestamp = parseInt(time),
            oDate = new Date(timestamp);
          sTimestamp = oDate.toDateString() + " " + oDate.toLocaleTimeString();
        }
        return sTimestamp;
      },
      formatSize: function (size) {
        var sSize = "";
        if (size) {
          var fileSizeExt = ["Bytes", "KB", "MB", "GB"],
            i = 0;
          while (size > 900) {
            size /= 1024;
            i++;
          }
          sSize = Math.round(size * 100) / 100 + " " + fileSizeExt[i];
        }
        return sSize;
      },
      onHomeIconPress: function () {
        window.location.replace("");
      },
      onPhotoChange: function (oEvent) {
        var oFileUploader = this._oView.byId("fileUploader");
        oFileUploader.setName("abc");
      }
    });
  }
);
