import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    Image,
    Alert,
    PermissionsAndroid,
    FlatList,
    TextInput,
    SafeAreaView,
    TouchableOpacity, Keyboard
} from 'react-native';
import * as Contacts from 'expo-contacts';
import Dialog from "react-native-dialog";
import ContactsNative from 'react-native-contacts';

//firebase
import {firebase} from '@react-native-firebase/database';
import KeyboardAvoidingView from "react-native/Libraries/Components/Keyboard/KeyboardAvoidingView";

//verificar se o keyboard tá up, devido à search bar
import KeyboardListener from 'react-native-keyboard-listener';

// como estamos com pressa isto tem imenso spaghetti code
// quando tiver tempo (talvez no ultimo sprint faça isto):
// 1 - simplificar o this.state no construtor, muitos elementos podiam ser objetos json
// 2 - as funcoes de handle, e as do dialog no geral dao completamente para reutilizar entre dialogs
// 3 - colocar as funcoes de uma determinada tarefa juntas e nao espalhadas pelo ficheiro à toa


export default class Contactspage extends React.Component {
    constructor(props) {
        super(props)
        const {navigation, route} = props
        const params = route.params
        /*props.navigation.setOptions({ headerLeft: () => (
          <Button
            onPress={() => props.navigation.navigate('Homepage',{balance: this.state.balance, piggybank: this.state.piggybank, refresh: 1})}
            title="<-"
          /> )})*/

        this.state = {
            newContactName: "",
            newContactNumber: "",
            addContactDialogVisibility: false,
            sendDirectlyDialogVisibility: false,
            fetchedContacts: [],
            contactsInMemory: [], // para a searchBar

            //own vcard
            phoneNumber: params.myPhoneNumber,
            balance: params.balance,
            piggybank: params.piggybank,
            pin: params.pin,
            authorized: false,

            //Outro
            receiverBalance: "",
            hasVCard: false,
            sendMoney: {receiverNumber: "", newReceiverBalance: "", newBalance: "", newPiggyBank: ""},

            //directly
            phoneDirectly: "",
            amountDirectly: "",

            //send to contact
            sendContactDialogVisibility: false,
            receiverName: "",
            phoneSendContact: "",
            sendContactDoubleDialogVisibility: false,
            fetchedContactPressed: [],
            firstFetchedContactPressed: "",
            amountDoubleContact: "",
            selectedContact: "",

            //fix search bar
            keyboardIsClosed: true
        }
    }


    async fetchContactsAsync() {
        // Ask for permission to query contacts.
        const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
        // const status  = await Contacts.requestPermissionsAsync();

        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
            // Permission was denied...
            Alert.alert("sem permissao")
        }
        const contacts = await Contacts.getContactsAsync({
            fields: [
                Contacts.PHONE_NUMBERS,
            ],
            pageSize: 0,
            pageOffset: 0,
        });

        var cleanContacts = []


        contacts.data.forEach((item) => {

            if (item.hasOwnProperty('phoneNumbers')) {
                let cleanContact = {name: "", phoneNumbers: []}

                cleanContact.id = item.id
                cleanContact.name = item.name
                for (let i = 0; i < item.phoneNumbers.length; i++) {
                    if (item.phoneNumbers[i] != "") {
                        cleanContact.phoneNumbers.push(item.phoneNumbers[i].number)
                    }
                }


                cleanContacts.push(cleanContact)
            }

        })

        if (cleanContacts == null) Alert.alert("lista cleanContacts vazia")
        //Alert.alert(cleanContacts.length.toString())
        //Alert.alert(cleanContacts[7].name)

        //Alert.alert(contacts.data[0].name)

        // acrescentei o "contactsInMemory: cleanContacts" porque vai ser preciso para a searchBar
        // Ao se fazer uma pesquisa, ao apagar-se a mesma, vai mostrar de novo todos os contactos existentes
        // pois este contactsInMemory servirá para guardar sempre todos os contactos
        this.setState({fetchedContacts: cleanContacts, contactsInMemory: cleanContacts})
    }

    componentDidMount() {
        this.fetchContactsAsync()
        console.log("pin: " + this.state.pin)
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
    }

   // componentWillMount() {

  //  }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    keyboardDidShow = () => {
        //alert('Keyboard Shown');
        this.setState({keyboardIsClosed: false})
    }

    keyboardDidHide = () => {
        //alert('Keyboard Hidden');
        this.setState({keyboardIsClosed: true})
    }


    searchContacts = (value) => {
        const filteredContacts = this.state.contactsInMemory.filter(contact => {
            let contactLowercase = (
                contact.name
            ).toLowerCase();

            let searchTermLowercase = value.toLowerCase();

            return contactLowercase.indexOf(searchTermLowercase) > -1;
        });
        this.setState({fetchedContacts: filteredContacts});
    }


    // create new contact
    async createNewContact() {

        const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS)

        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
            // Permission was denied...
            Alert.alert("Permission was denied")
        }

        var newPerson = {
            phoneNumbers: [{
                label: 'mobile',
                number: this.state.newContactNumber,
            }],
            givenName: this.state.newContactName,
        }

        ContactsNative.addContact(newPerson)
        this.fetchContactsAsync()

        this.setState({addContactDialogVisibility: false})

    }

    showNewContactDialog() {
        this.setState({addContactDialogVisibility: true})
    }

    handleNewContact = (nameOrNumber, isName) => {
        if (isName) {
            this.setState({newContactName: nameOrNumber})
        }
        if (!isName) {
            this.setState({newContactNumber: nameOrNumber})
        }
    }

    cancelNewContact() {
        this.setState({addContactDialogVisibility: false})
    }

    handleDirecly = (phoneOrAmount, isPhoneNumber) => {
        if (isPhoneNumber) {
            this.setState({phoneDirectly: phoneOrAmount})
        }
        if (!isPhoneNumber) {
            this.setState({amountDirectly: phoneOrAmount})
        }
    }

    // send money directly
    cancelSendMoneyDirectly() {
        this.setState({sendDirectlyDialogVisibility: false, phoneDirectly: "", amountDirectly: ""})
    }

    sendMoneyDirectly() {
        this.setState({sendDirectlyDialogVisibility: false})
        this.validateTransfer(this.state.phoneDirectly, this.state.amountDirectly)
    }

    showSendMoneyDirectly() {
        this.setState({sendDirectlyDialogVisibility: true})
    }

    //send money to a contact
    async checkExistsAndSend(item) {
        if (item.phoneNumbers.length === 1) {
            const hasVCard = await this.hasVCard(item.phoneNumbers[0])
            if (this.state.hasVCard) this.sendMoneyContact(item, true)
            else Alert.alert("This phone number does not have VCard")
        } else {
            var invalidPhone = 0
            var validPhone = 0
            this.state.fetchedContactPressed.length = 0
            this.setState({firstFetchedContactPressed: "", selectedContact: ""})
            console.log("bueda contactos mano")
            //mostrar o dialog para contactos com varios nºs de tlm
            for (var i = 0; i < item.phoneNumbers.length; i++) {

                var hasVCard = await this.hasVCard(item.phoneNumbers[i])
                if (this.state.hasVCard) {
                    if (validPhone == 0) this.setState({firstFetchedContactPressed: item.phoneNumbers[i]})
                    this.state.fetchedContactPressed.push({phone: item.phoneNumbers[i]})
                    validPhone = validPhone + 1
                } else {
                    invalidPhone = invalidPhone + 1
                }
            }

            if (invalidPhone == item.phoneNumbers.length || validPhone == 0) {
                Alert.alert("This contact does not have VCard.\nAll phone numbers don't have VCard.")
            } else {
                if (this.state.hasVCard) this.sendMoneyContact(this.state.fetchedContactPressed, false)
            }
        }
    }

    sendMoneyContact(item, isOne) {
        if (isOne) {
            this.setState({
                sendContactDialogVisibility: true,
                receiverName: item.name,
                phoneSendContact: item.phoneNumbers[0]
            })
        } else {
            this.setState({sendContactDoubleDialogVisibility: true})
        }
    }

    handleSendContact = (amount) => {
        this.setState({amountContact: amount})
    }

    handleSendDoubleContact = (amount) => {
        this.setState({amountDoubleContact: amount})
    }


    cancelSendMoneyContact() {
        this.setState({sendContactDialogVisibility: false, amountContact: ""})
    }

    cancelSendMoneyDoubleContact() {
        this.setState({sendContactDoubleDialogVisibility: false, amountDoubleContact: ""})
    }

    sendMoneyDoubleContact() {
        var phoneNumber = this.state.selectedContact == "" ? this.state.firstFetchedContactPressed : this.state.selectedContact
        this.validateTransfer(phoneNumber, this.state.amountDoubleContact)
    }

    selectDoubleContact(item) {
        console.log("phone selected: " + item.phone)
        this.setState({selectedContact: item.phone})
    }

    sendMoneyContactDialog() {
        this.setState({sendContactDialogVisibility: false})
        this.validateTransfer(this.state.phoneSendContact, this.state.amountContact)
    }

    // send money
    async readVCard(phoneNumber, isMine) {
        try {
            const snapshot = await firebase
                .app()
                .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
                .ref('/vcards/' + phoneNumber)
                .once('value')
            if (!snapshot) throw new Error('Could not get snapshot')
            isMine ? this.setState({
                balance: snapshot.toJSON().balance,
                piggybank: snapshot.toJSON().piggybank
            }) : this.setState({receiverBalance: snapshot.toJSON().balance})
        } catch (error) {
            console.log("Read vCard " + phoneNumber + ": " + error)
        }
    }

    async updateBalance(phoneNumber, newBalance, isSender,amount,phoneNumberTransaction) {
        const balance = await firebase
            .app()
            .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
            .ref('/vcards/' + phoneNumber)
            .update({
                balance: "" + newBalance + ""
            })


        if (isSender) {
            var oldBalanceDebit = parseFloat(newBalance) + parseFloat(amount)

            const transaction = await firebase
            .app()
            .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
            .ref('/vcards/' + phoneNumber + '/transactions')
            .child('' + Date.now() +'')
            .set({
                type: "Debit",
                amount: "-" + amount + "",
                currentBalance: "" + newBalance + "",
                oldBalance: "" + oldBalanceDebit + "",
                phoneNumber: phoneNumberTransaction
            })
        } else {
            var oldBalanceCredit = parseFloat(newBalance) - parseFloat(amount)

            const transaction = await firebase
            .app()
            .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
            .ref('/vcards/' + phoneNumber + '/transactions')
            .child('' + Date.now() +'')
            .set({
                type: "Credit",
                amount: "+" + amount + "",
                currentBalance: "" + newBalance + "",
                oldBalance: "" + oldBalanceCredit + "",
                phoneNumber: phoneNumberTransaction
            })
        }
    }

    async hasVCard(phoneNumber) {
        try {
            const snapshot = await firebase
                .app()
                .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
                .ref('/vcards/' + phoneNumber)
                .once('value')

            if (snapshot.exists()) {
                this.setState({hasVCard: true})
            } else {
                this.setState({hasVCard: false})
            }

        } catch (error) {
            console.log("Has vCard " + phoneNumber + ": " + error)
        }

    }


    sumSubtractionToString(one, two, isSum) {
        if (isNaN(one) || isNaN(two)) console.log("Invalid inputs.")
        else return isSum ? (parseFloat(one) + parseFloat(two)).toString() : (parseFloat(one) - parseFloat(two)).toString()
    }

    // qwertyu

    validateTransfer = async (receiver, amount) => {
        var autoSaving = Math.ceil(parseFloat(amount)) - parseFloat(amount);
        var avaiableBalance = parseFloat(this.state.balance) - parseFloat(this.state.piggybank)
        try {
            const hasVCard = await this.hasVCard(receiver)
            if (this.state.hasVCard) {
                if (avaiableBalance - parseFloat(amount) >= 0) {
                    if (parseFloat(amount) > 0 ) {
                        const readVCard = await this.readVCard(receiver, false)
                        const newReceiverBalance = this.sumSubtractionToString(this.state.receiverBalance, amount, true)
                        const newBalance = this.sumSubtractionToString(this.state.balance, amount, false)
                        const newPiggyBank =this.sumSubtractionToString(this.state.piggybank, autoSaving, true)
                        if(autoSaving > 0) {
                            this.setState({
                                sendMoney: {
                                    receiverNumber: receiver,
                                    newReceiverBalance: parseFloat(newReceiverBalance).toFixed(2),
                                    newBalance: parseFloat(newBalance).toFixed(2),
                                    newPiggyBank: parseFloat(newPiggyBank).toFixed(2),
                                    amount: amount
                                }, pinDialogVisibility: true
                            })
                        }
                    else{
                            this.setState({
                                sendMoney: {
                                    receiverNumber: receiver,
                                    newReceiverBalance: parseFloat(newReceiverBalance).toFixed(2),
                                    newBalance: parseFloat(newBalance).toFixed(2),
                                    newPiggyBank: parseFloat(this.state.piggybank).toFixed(2),
                                    amount: amount
                                }, pinDialogVisibility: true
                            })
                        }
                    } else {
                        Alert.alert("This amount is not valid. The amount of money has to be > 0")
                    }
                } else {
                    Alert.alert("Not enough money to realize this operation.")
                }
            } else {
                Alert.alert("This phone number does not have a VCard.")
            }

            console.log("hasVCard: " + hasVCard + " readVCard: " +
                "\nnewReceiverBalance: ")

        } catch (error) {
            console.log("fetchData error: " + error)
        }
    }

    sendMoney = async (data) => {
        const updateReceiverBalance = await this.updateBalance(data.receiverNumber, data.newReceiverBalance, false, data.amount, this.state.phoneNumber)
        const updateBalance = await this.updateBalance(this.state.phoneNumber, data.newBalance, true, data.amount, data.receiverNumber)
        const updatePiggy = await this.updatePiggy(this.state.phoneNumber, data.newPiggyBank)
    }

    async updatePiggy(phoneNumber, newPiggy) {
        const balance = await firebase
            .app()
            .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
            .ref('/vcards/' + phoneNumber)
            .update({
                piggybank: "" + newPiggy + ""
            })
    }

    // pin
    handlePIN = (pin) => {
        this.setState({insertedPin: pin})
    }

    cancelPIN() {
        this.setState({pin: ""})
        this.setState({pinDialogVisibility: false})
        Alert.alert("Operation cancelled.\nTrasfer not made.")
    }

    comparePINsSendMoney() {
        if (this.state.pin === this.state.insertedPin) {
            this.setState({pinDialogVisibility: false})
            this.setState({authorized: true})
            this.sendMoney(this.state.sendMoney)
            Alert.alert("Confirmation code matches.\nSuccessful trasfer!")
            this.props.navigation.navigate('Homepage', {
                balance: this.state.balance,
                piggybank: this.state.piggybank,
                refresh: 1
            })

        } else {
            Alert.alert("Confirmation code does not match.\nTrasfer not made.")
        }
    }


    render() {
        return (

            <View style={{flex: 1, backgroundColor: '#9FE3DA'}}>
                <View style={styles.container}>
                    <Dialog.Container visible={this.state.pinDialogVisibility}>
                        <Dialog.Title>Transfer confirmation</Dialog.Title>
                        <Dialog.Input label="Insert confirmation code"
                                      onChangeText={(confirmationCode) => this.handlePIN(confirmationCode)}
                                      secureTextEntry={true}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={this.cancelPIN.bind(this)}/>
                        <Dialog.Button label="Ok" onPress={this.comparePINsSendMoney.bind(this)}/>
                    </Dialog.Container>
                </View>

                <View style={styles.container}>
                    <Dialog.Container visible={this.state.addContactDialogVisibility}>
                        <Dialog.Title>New Contact</Dialog.Title>
                        <Dialog.Input label="Name"
                                      onChangeText={(contactName) => this.handleNewContact(contactName, true)}></Dialog.Input>
                        <Dialog.Input label="Phone Number"
                                      onChangeText={(phoneNumber) => this.handleNewContact(phoneNumber, false)}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={() => this.cancelNewContact()}/>
                        <Dialog.Button label="Add" onPress={this.createNewContact.bind(this)}/>
                    </Dialog.Container>
                </View>

                <View style={styles.container}>
                    <Dialog.Container visible={this.state.sendDirectlyDialogVisibility}>
                        <Dialog.Title>Send money</Dialog.Title>
                        <Dialog.Input label="Phone Number"
                                      onChangeText={(phoneNumber) => this.handleDirecly(phoneNumber, true)}></Dialog.Input>
                        <Dialog.Input label="Amount of money"
                                      onChangeText={(amount) => this.handleDirecly(amount, false)}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={() => this.cancelSendMoneyDirectly()}/>
                        <Dialog.Button label="Send" onPress={() => this.sendMoneyDirectly()}/>
                    </Dialog.Container>
                </View>

                <View style={styles.container}>
                    <Dialog.Container visible={this.state.sendContactDialogVisibility}>
                        <Dialog.Title>Send money to contact</Dialog.Title>
                        <Dialog.Input label="Amount of money"
                                      onChangeText={(amount) => this.handleSendContact(amount)}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={() => this.cancelSendMoneyContact()}/>
                        <Dialog.Button label="Send" onPress={() => this.sendMoneyContactDialog()}/>
                    </Dialog.Container>
                </View>

                <View>
                    <Dialog.Container visible={this.state.sendContactDoubleDialogVisibility}>
                        <Dialog.Title>Send Money
                            to {this.state.selectedContact == "" ? this.state.firstFetchedContactPressed : this.state.selectedContact}</Dialog.Title>
                        <FlatList
                            data={this.state.fetchedContactPressed}
                            renderItem={({item}) =>
                                <TouchableOpacity onPress={() => this.selectDoubleContact(item)}>
                                    <View>
                                        <Dialog.Description>{item.phone}</Dialog.Description>
                                    </View>
                                </TouchableOpacity>}
                        />
                        <Dialog.Input label="Amount of money"
                                      onChangeText={(amount) => this.handleSendDoubleContact(amount)}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={() => this.cancelSendMoneyDoubleContact()}/>
                        <Dialog.Button label="Send" onPress={() => this.sendMoneyDoubleContact()}/>
                    </Dialog.Container>
                </View>

                <View style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    backgroundColor: '#9FE3DA',
                    position: 'relative',
                }}>
                    <View style={styles.containerSearchBarAddContact}>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="  Search here ..."
                            placeholderTextColor='#dddddd'
                            onChangeText={(value) => this.searchContacts(value)}
                        />

                        <SafeAreaView style={{backgroundColor: '#2f363c'}}/>
                        <TouchableOpacity onPress={() => this.showNewContactDialog()}>
                            <Image style={styles.addNewContact} source={require('../images/newContact.png')}/>
                        </TouchableOpacity>
                    </View>

                    {
                        this.state.keyboardIsClosed === true ?
                            <View style={styles.viewSendDirectlyPhoneNumber}>
                                <Button color="#333333" title={'Send directly to a phone number'}
                                        onPress={() => this.showSendMoneyDirectly()}/>
                            </View> :
                            this.state.keyboardIsClosed === false &&
                            <View style={{marginBottom: "5%"}}></View>
                    }

                    <View style={{display: 'flex', flexDirection: 'column', flex: 85, backgroundColor: '#9FE3DA'}}>
                        <FlatList
                            data={this.state.fetchedContacts}
                            renderItem={({item}) =>
                                <TouchableOpacity onPress={() => this.checkExistsAndSend(item)}>
                                    <View style={styles.containerContactos}>
                                        <Text style={styles.contactName}>{item.name}</Text>
                                        {item.phoneNumbers.map((phoneNumber) => {
                                            return (<Text key={phoneNumber}
                                                          style={styles.contactPhoneNumber}>{phoneNumber}</Text>)
                                        })}
                                    </View>
                                </TouchableOpacity>}
                        />
                    </View>
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    buttonCard: {
        position: 'relative',
        top: 0,
        right: 0,
        backgroundColor: '#333333',
        width: 410,
        height: 34,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 18,
        textAlignVertical: 'center',
    },
    containerContactos: {
        backgroundColor: '#425E5B',
        height: 80,
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    contactName: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold'
    },
    contactPhoneNumber: {
        color: '#c3c3c3',
        fontSize: 13,
        fontWeight: 'bold'
    },
    containerSearchBarAddContact: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        flex: 10,
        justifyContent: "space-around",
        marginTop: "1.25%",
        marginBottom: "4%",
    },
    containerSearchBar: {
        flex: 1,
        borderRadius: 10
    },
    searchBar: {
        marginTop: "3%",
        backgroundColor: '#696969',
        color: 'white',
        height: 43,
        width: "71%",
        fontSize: 18,
        padding: 10,
        borderRadius: 25,
        fontWeight: 'bold'
    },
    addNewContact: {
        height: 65,
        width: 65,
    },
    viewSendDirectlyPhoneNumber: {
        width: "93%",
        alignSelf: "center",
        display: 'flex',
        flexDirection: 'column',
        flex: 7,
        backgroundColor: '#9FE3DA'
    }
})