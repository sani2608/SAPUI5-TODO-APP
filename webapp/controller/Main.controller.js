sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/ui/core/Fragment", "sap/m/MessageBox"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Fragment, MessageBox) {
    ("use strict");

    return Controller.extend("com.sani.todo.controller.Main", {
      _service: {
        EditSpath: "",
      },
      onInit: function () {
        this._setTodoModel();
      },

      _setTodoModel: function () {
        const data = {};
        data.results = this._getMockTodos();
        data.InputField = "";
        data.EditInputField = "";
        data.DatePickerField = "";
        data.EditDatePickerField = "";
        data.CompletePanelFlag = true;
        data.IncompletePanelFlag = true;
        const oJsonModel = new JSONModel(data);
        this.getView().setModel(oJsonModel, "todosModel");
      },

      onLIstItemSelectToComplete: function (oEvent) {
        const { oTodosModel, iSelectedObjectId } = this._getModelAndSelectedItemId(oEvent);

        let allTodos = oTodosModel.getProperty("/results");
        allTodos = allTodos.map((todo) => {
          return { ...todo, done: todo.done || iSelectedObjectId === todo.id };
        });
        oTodosModel.setProperty("/results", allTodos);
        this._removeSelections();
        this._handlePanelVisibility();
      },

      onLIstItemSelectToUnComplete: function (oEvent) {
        const { oTodosModel, iSelectedObjectId } = this._getModelAndSelectedItemId(oEvent);

        let allTodos = oTodosModel.getProperty("/results");
        allTodos = allTodos.map((todo) => {
          if (iSelectedObjectId === todo.id) todo.done = false;
          return todo;
        });
        oTodosModel.setProperty("/results", allTodos);
        this._removeSelections();
        this._handlePanelVisibility();
      },

      /**
       * When any of the list is empty collapse the panel
       */
      _handlePanelVisibility: function () {
        const { aTodos } = this._getModelAndData("todosModel");
        let bCompleteFlag = false;
        let bInCompleteFlag = false;
        aTodos.forEach((todo) => {
          if (todo.done === true) bCompleteFlag = true;
          else bInCompleteFlag = true;
        });
        this.byId("id_incomplete_panel").setExpanded(bInCompleteFlag);
        this.byId("id_complete_panel").setExpanded(bCompleteFlag);
      },

      /**
       * to remove the list selections
       */
      _removeSelections: function () {
        this.byId("id_completed_todos_list").removeSelections();
        this.byId("id_incompleted_todos_list").removeSelections();
      },

      _getModelAndSelectedItemId: function (oEvent) {
        const oSelectedListItem = oEvent.getParameter("listItem");
        const oBindingContext = oSelectedListItem.getBindingContext("todosModel");
        const oSelectedObject = oBindingContext.getObject();
        const iSelectedObjectId = oSelectedObject.id;
        const oTodosModel = oSelectedListItem.getModel("todosModel");
        return { oTodosModel, iSelectedObjectId };
      },

      onDeleteTodoButtonPress: function (oEvent) {
        console.log(oEvent);
        const { oTodosModel, aTodos } = this._getModelAndData("todosModel");
        const oBindingContext = oEvent.getSource().getBindingContext("todosModel");
        const iSelectedObjectId = oBindingContext.getObject().id;
        const aUpdated = aTodos.filter((todo) => todo.id !== iSelectedObjectId);
        oTodosModel.setProperty("/results", aUpdated);

        this._handlePanelVisibility();
      },

      onEditTodoButtonPress: function (oEvent) {
        console.log(oEvent);
        this._openEditDialog();

        const oBindingContext = oEvent.getSource().getBindingContext("todosModel");
        const { deadline, text } = oBindingContext.getObject();
        this._service.EditSpath = oBindingContext.getPath();

        const { oTodosModel } = this._getModelAndData("todosModel");
        oTodosModel.setProperty("/EditInputField", text);
        oTodosModel.setProperty("/EditDatePickerField", deadline);
      },

      _openEditDialog: function () {
        const oView = this.getView();

        // create the dialog lazily
        if (!oView.byId("editTodoDialog")) {
          const oFragmentController = {
            onCloseDialog: function () {
              debugger;
              oView.byId("editTodoDialog").close();
            },
          };
          // load asynchronous XML fragment
          Fragment.load({
            id: oView.getId(),
            name: "com.sani.todo.view.EditTodo",
            controller: this,
          }).then(function (oDialog) {
            // connect dialog to the root view of the component(models, lifecycle)
            oView.addDependent(oDialog);
            // forward compact/cozy style into dialog
            oDialog.open();
          });
        } else {
          oView.byId("editTodoDialog").open();
        }
      },

      /**
       * @param {string} sModelName is model name.
       * @returns model and the data of the model.
       */
      _getModelAndData: function (sModelName) {
        const oTodosModel = this.getView().getModel(sModelName);
        const aTodos = oTodosModel.getProperty("/results");
        const oData = oTodosModel.getProperty("/");

        return { oTodosModel, aTodos, oData };
      },

      /**
       * @returns mock todos array
       */
      _getMockTodos: function () {
        const aMockTodos = [
          {
            text: "Get some carrots",
            id: 1,
            deadline: "27/7/2022",
            done: false,
          },
          {
            text: "Do some magic",
            id: 2,
            deadline: "22/7/2022",
            done: false,
          },
          {
            text: "Go to the gym and workout",
            id: 3,
            deadline: "24/7/2022",
            done: true,
          },
          {
            text: "Buy milk",
            id: 4,
            deadline: "30/7/2022",
            done: false,
          },
          {
            text: "Eat some fruits",
            id: 5,
            deadline: "29/7/2022",
            done: true,
          },
        ];
        return aMockTodos;
      },

      onAddTodoButtonPress: function () {
        const {
          oTodosModel,
          aTodos,
          oData: { DatePickerField, InputField },
        } = this._getModelAndData("todosModel");

        // if input field is empty show warning message.
        if (InputField) {
          const newTodo = {
            id: aTodos.length + 1,
            text: InputField,
            deadline: DatePickerField,
            done: false,
          };
          oTodosModel.setProperty("/results", [...aTodos, newTodo]);
          oTodosModel.setProperty("/DatePickerField", "");
          oTodosModel.setProperty("/InputField", "");

          this._handlePanelVisibility();
        } else {
          MessageBox.warning("Task cannot be empty");
        }
      },

      onCloseDialog: function (oEvent) {
        const bIsSaveBtnPressed = oEvent.getParameter("id").includes("id_save_btn");
        if (bIsSaveBtnPressed) {
          const {
            oTodosModel,
            oData: { EditDatePickerField, EditInputField },
          } = this._getModelAndData("todosModel");

          let oTaskToEdit = oTodosModel.getProperty(this._service.EditSpath);

          oTodosModel.setProperty(this._service.EditSpath, {
            ...oTaskToEdit,
            deadline: EditDatePickerField,
            text: EditInputField,
          });
        }

        this.byId("editTodoDialog").close();
      },
    });
  }
);
