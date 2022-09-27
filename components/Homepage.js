import React, {Component} from 'react';
import {View, Text, StyleSheet, Button, Image, Alert, TouchableOpacity, AsyncStorage, ToastAndroid } from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { showMessage } from "react-native-flash-message";

//firebase
import {firebase} from '@react-native-firebase/database';
import Dialog from "react-native-dialog";

class Homepage extends React.Component {
    constructor(props) {
        super(props)
        const {navigation, route} = props;
        const params = route.params;
        var myPhoneNumber = params.myPhoneNumber
        this.state = {
            myPhoneNumber: myPhoneNumber,
            oldBalance: params.balance,
            balance: params.balance,
            piggybank: params.piggybank,
            refresh: params.refresh == undefined ? 0 : params.refresh,
            pin: params.pin,
            transactions: [],
            numberTransactions: "",
            message: "",
            enableNotifications: true,
            titleNotifications: "Disable Notifications",
            lastTransaction: "",
            deleteDialogVisibility: false,
            isDeleted: params.isDeleted
        }

    }

    componentDidMount() {
        this._retrieveData()
        if(!this.state.isDeleted) this.readValues(this.state.myPhoneNumber)
    }

    _storeData = async (value) => {
        try {
            await AsyncStorage.setItem(
                'oldBalance',
                value
            );
        } catch (error) {
            // Error saving data
            console.log("error while storing: " + error)
        }
    };

    _retrieveData = async () => {
        try {
            const value = await AsyncStorage.getItem('oldBalance');
            if (value !== null) {
                // We have data!!
                this.setState({oldBalance: value})

            } else {
                // we dont have data

            }
        } catch (error) {
            // Error retrieving data
            console.log(error)
        }
    };


    readValues(phoneNumber) {
            const getBalance = firebase
            .app()
            .database('Insert firebase url')
            .ref('/vcards/' + phoneNumber)
            .on('value', snapshot => {
                if(snapshot.val() != null){
                    console.log("ENTROU NO SNAPSHOT")
                    this.setState({
                        balance: snapshot.toJSON().balance, piggybank: snapshot.toJSON().piggybank,
                        pin: snapshot.toJSON().pin, transactions: snapshot.toJSON().transactions
                    })
    
                    if (this.state.oldBalance == this.state.balance) {
                        console.log("entrou aqui memo")
                        this.setState({oldBalance: snapshot.toJSON().balance})
                        this._storeData(this.state.oldBalance)
                        if(snapshot.toJSON().transactions !== undefined){
                            var arrayTransactions = Object.keys(snapshot.toJSON().transactions).map(key => ({[key]: snapshot.toJSON().transactions[key]}))
                            var arrayTransactionKeys = arrayTransactions.map(i => Number(Object.keys(i)[0]))
                            var lastTransaction = snapshot.toJSON().transactions[Math.max(...arrayTransactionKeys).toString()]
                            this.setState({lastTransaction: lastTransaction})
                        }
                    } else {
                        if (snapshot.toJSON().transactions !== undefined) {
                            console.log("ENTROU NO != undefined")
                            var arrayTransactions = Object.keys(snapshot.toJSON().transactions).map(key => ({[key]: snapshot.toJSON().transactions[key]}))
                            var arrayCreditTransactions = arrayTransactions.filter(i => i[Object.keys(i)[0]].type == 'Credit')
                            var arrayTransactionKeys = arrayTransactions.map(i => Number(Object.keys(i)[0]))
                            var arrayCreditTransactionKeys = arrayCreditTransactions.map(i => Number(Object.keys(i)[0]))
                            var lastCreditTransaction = snapshot.toJSON().transactions[Math.max(...arrayCreditTransactionKeys).toString()]
                            var lastTransaction = snapshot.toJSON().transactions[Math.max(...arrayTransactionKeys).toString()]
                            this.setState({lastTransaction: lastTransaction})
    
    
                            if (parseFloat(this.state.oldBalance) < parseFloat(snapshot.toJSON().balance) && this.state.enableNotifications) {
                               var msg = 'You received ' + lastCreditTransaction.amount + ' from VCard ' + lastCreditTransaction.phoneNumber
                                showMessage({
                                    message: ""+msg+"",
                                    type: "success",
                                  });
                            }
    
                            this._storeData(snapshot.toJSON().balance)
                        }
                    }

                }
            })
    }

    showDeleteCardDialog() {
        this.setState({deleteDialogVisibility: true})
    }

    cancelDeleteVCard() {
        this.setState({deleteDialogVisibility: false})
    }

    async removeValue(key){
        try {
            await AsyncStorage.removeItem(key);
            return true;
        }
        catch(exception) {
            return false;
        }
    }

    deleteVCard(phoneNumber) {
        console.log("isDeleted before: "+ this.state.isDeleted)
        this.setState({isDeleted: true}, () => {
            console.log("entrou na callback: " + this.state.isDeleted)
            const remove = firebase
                .app()
                .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
                .ref('/vcards/' + phoneNumber)
                .remove();
            this.removeValue('phoneNumber');
            this.props.navigation.navigate('Freshman')
        })
    }

    render() {
        return (
            <View style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: "space-between",
                backgroundColor: '#9FE3DA'
            }}>

                <View style={styles.container}>
                    <Dialog.Container visible={this.state.deleteDialogVisibility}>
                        <Dialog.Title>You sure you want to delete this VCard?</Dialog.Title>
                        <Dialog.Button label="Cancel" onPress={() => this.cancelDeleteVCard()}/>
                        <Dialog.Button label="Delete" onPress={() => this.deleteVCard(this.state.myPhoneNumber)}/>
                    </Dialog.Container>
                </View>
                {/* card area */}
                <Text style={styles.cardTitle}>Card:</Text>
                {
                    this.state.balance > 0 ?
                        <View style={styles.allCard}>
                            <View style={styles.card}>
                                <TouchableOpacity onPress={() => Alert.alert("The balance is not 0€.")}>
                                    <Image style={styles.bin} source={require('../images/deleteVCard.png')}></Image>
                                </TouchableOpacity>
                                <View style={styles.viewLeft}>
                                    <Image style={styles.cardLogo} source={require('../images/vcard.png')}></Image>
                                    <Image style={styles.cardChip} source={require('../images/cardChip.png')}></Image>
                                    <Text style={styles.cardNumber}>{this.state.myPhoneNumber}</Text>
                                </View>
                                <View style={styles.viewBalance}>
                                    <Text style={styles.cardBalance}>{this.state.balance}€</Text>
                                </View>
                            </View>
                        </View> :
                        <View style={styles.allCard}>
                            <View style={styles.card}>
                                <TouchableOpacity onPress={() => this.showDeleteCardDialog()}>
                                    <Image style={styles.bin} source={require('../images/deleteVCard.png')}></Image>
                                </TouchableOpacity>
                                <View style={styles.viewLeft}>
                                    <Image style={styles.cardLogo} source={require('../images/vcard.png')}></Image>
                                    <Image style={styles.cardChip} source={require('../images/cardChip.png')}></Image>
                                    <Text style={styles.cardNumber}>{this.state.myPhoneNumber}</Text>
                                </View>
                                <View style={styles.viewBalance}>
                                    <Text style={styles.cardBalanceZero}>{this.state.balance}€</Text>
                                </View>

                            </View>
                        </View>
                }

                {/* Piggy area*/}
                <View style={styles.viewPiggy}>
                    <Image style={styles.imagePiggy} source={require('../images/piggy.png')}></Image>
                    <Text style={styles.cardPiggy}>{this.state.piggybank}€</Text>
                </View>

                {/* buttons area*/}
                { this.state.balance > 0 ?
                <View style={styles.buttonArea}>
                    <View style={styles.viewButtons}>
                        <View style={styles.sendMoneySafe}>
                            <View style={styles.sendMoney}>
                                <Button color="#333333" title={'Send Money'}
                                        onPress={() => this.props.navigation.navigate('Contactspage',
                                            {
                                                myPhoneNumber: this.state.myPhoneNumber,
                                                balance: this.state.balance,
                                                piggybank: this.state.piggybank,
                                                pin: this.state.pin
                                            })}/>
                            </View>
                            <View style={styles.safeButton}>
                                <Button color="#333333" title={'Safe'}
                                        onPress={() => this.props.navigation.navigate('Piggybank',
                                            {
                                                myPhoneNumber: this.state.myPhoneNumber,
                                                balance: this.state.balance,
                                                piggybank: this.state.piggybank
                                            })}/>
                            </View>
                        </View>
                        <View style={styles.transactionsNotifications}>
                            <View style={styles.showTransactions}>
                                <Button color="#333333" title={'Show Transactions'}
                                        onPress={() => this.props.navigation.navigate('Transactionspage', {transactions: this.state.transactions})}/>
                            </View>
                            <View style={styles.notifications}>
                                <Button color="#333333" title={this.state.titleNotifications} onPress={() => {
                                    this.state.enableNotifications == false ? this.setState({
                                            enableNotifications: true,
                                            titleNotifications: "Disable notifications"
                                        }) :
                                        this.setState({
                                            enableNotifications: false,
                                            titleNotifications: "Enable notifications"
                                        })
                                }}/>
                            </View>
                        </View>
                    </View>
                </View>
                :
                <View style={styles.buttonArea}>
                    <View style={styles.viewButtons}>
                        <View style={styles.sendMoneySafe}>
                            <View style={styles.sendMoneyRed}>
                                <Button color="#ff0000" title={'Send Money'}/>
                            </View>
                            <View style={styles.safeButton}>
                                <Button color="#333333" title={'Safe'}
                                        onPress={() => this.props.navigation.navigate('Piggybank',
                                            {
                                                myPhoneNumber: this.state.myPhoneNumber,
                                                balance: this.state.balance,
                                                piggybank: this.state.piggybank
                                            })}/>
                            </View>
                        </View>
                        <View style={styles.transactionsNotifications}>
                            <View style={styles.showTransactions}>
                                <Button color="#333333" title={'Show Transactions'}
                                        onPress={() => this.props.navigation.navigate('Transactionspage', {transactions: this.state.transactions})}/>
                            </View>
                            <View style={styles.notifications}>
                                <Button color="#333333" title={this.state.titleNotifications} onPress={() => {
                                    this.state.enableNotifications == false ? this.setState({
                                            enableNotifications: true,
                                            titleNotifications: "Disable notifications"
                                        }) :
                                        this.setState({
                                            enableNotifications: false,
                                            titleNotifications: "Enable notifications"
                                        })
                                }}/>
                            </View>
                        </View>
                    </View>
                </View>
                }

                {/* last transaction area */}
                <View style={styles.lastTransactionArea}>
                    <Text style={styles.lastTransactionTitle}>Last Transaction:</Text>
                    <View style={styles.lastTransaction}>
                        {this.state.lastTransaction ?
                            <View>
                            <Text style={styles.lastTransactionExample}>Value:{this.state.lastTransaction.amount}€
                                Type:{this.state.lastTransaction.type} VCard:{this.state.lastTransaction.phoneNumber}</Text>
                            <Text style={styles.lastTransactionExample}>Available
                            Balance:{this.state.lastTransaction.currentBalance}€ Balance before
                            transaction:{this.state.lastTransaction.oldBalance}€</Text>
                            </View>
                            : <Text style={{textAlign: 'center'}}>No transactions made</Text>
                        }
                    </View>
                </View>


            </View>
        );
    }
}

const styles = StyleSheet.create({
    bin: {
        position: 'relative',
        height: 20,
        width: 20,
        //elevation: 4,
        marginLeft: "92%",
        marginTop: "2%",
    },
    //Card
    cardTitle: {
        marginTop: "2%",
        position: 'relative',
        marginLeft: "3%",
        marginBottom: "2%"
    },
    allCard: {
        position: "relative",
        flex: 9,
        marginBottom: "5%",
    },

    card: {
        position: 'relative',
        backgroundColor: '#cfe2f3',
        height: 200,
        width: "95%",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        //elevation: 4,
        alignSelf: "center",
        //justifyContent: "center",
        //alignItems: "center",
    },
    viewLeft: {
        display: 'flex',
        flexDirection: 'column',
        flex: 5,
        justifyContent: "space-evenly",
        position: "absolute",
        //alignItems: "center",
        direction: "ltr"
    },
    cardLogo: {
        marginTop: "-5%",
        position: 'relative',
        height: 100,
        width: 175,
        //elevation: 4,
        marginBottom: "-6%"
    },
    cardChip: {
        position: 'relative',
        height: 50,
        width: 55,
        //elevation: 4,
        marginLeft: "30%",
    },
    cardNumber: {
        marginTop: "15%",
        position: 'relative',
        //elevation: 4,
        fontSize: 21,
        marginLeft: "7%",
    },
    viewBalance: {
        position: "relative",
        display: 'flex',
        flexDirection: 'column',
        flex: 7,
        direction: "rtl",
        //alignSelf: "center",
        justifyContent: "space-evenly",
        alignItems: "flex-end",
        marginRight: "11%",
    },
    cardBalance: {
        marginTop: "6%",
        position: 'relative',
        elevation: 4,
        fontSize: 20,
        fontWeight: "bold",
    },
    cardBalanceZero: {
        marginTop: "6%",
        position: 'relative',
        elevation: 4,
        fontSize: 20,
        fontWeight: "bold",
        color: '#ff0000'
    },

    //Piggy
    viewPiggy: {
        marginTop: "32%",
        flex: 7,
        alignItems: "center",
        marginBottom: "10%",
    },
    imagePiggy: {
        alignItems: "center",
        position: 'relative',
        height: 175,
        width: 280,
    },
    cardPiggy: {
        marginTop: "-22%",
        position: 'relative',
        elevation: 4,
        fontSize: 20,
        fontWeight: "bold",
        alignSelf: "center",
        marginLeft: "3%",
    },

    // buttons
    buttonArea: {
        flex: 53, //41
        position: 'relative',
    },
    viewButtons: {
        flex: 16,
        position: 'relative',
        justifyContent: "space-evenly",
    },
    transactionsNotifications: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    sendMoneySafe: {
        position: "relative",
        marginTop: "25%",
        display: 'flex',
        flexDirection: 'row',
        flex: 7,
        justifyContent: "space-evenly",
        alignItems: "center",
    },
    sendMoney: {
        position: 'relative',
        width: "47%",
        borderRadius: 20,
        paddingVertical: 1,
        paddingHorizontal: 10,
        backgroundColor: '#333333',
    },
    sendMoneyRed: {
        position: 'relative',
        width: "47%",
        borderRadius: 20,
        paddingVertical: 1,
        paddingHorizontal: 10,
        backgroundColor: '#ff0000',
    },
    showTransactions: {
        position: 'relative',
        alignSelf: "center",
        width: "96%",
        borderRadius: 20,
        paddingVertical: 1,
        paddingHorizontal: 10,
        backgroundColor: '#333333',
    },
    notifications: {
        position: 'relative',
        alignSelf: "center",
        width: "96%",
        borderRadius: 20,
        paddingVertical: 1,
        paddingHorizontal: 10,
        backgroundColor: '#333333',
        marginTop: "1.2%"
    },
    safeButton: {
        position: 'relative',
        alignSelf: "center",
        width: "47%",
        borderRadius: 20,
        paddingVertical: 1,
        paddingHorizontal: 10,
        backgroundColor: '#333333',
    },

    // last transaction
    lastTransactionArea: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: "3%",
        position: "relative",
        flex: 15,
        justifyContent: "center",
    },
    lastTransactionTitle: {
        position: 'relative',
        marginLeft: "4%",
        marginBottom: "1%",
    },
    lastTransaction: {
        position: 'relative',
        alignSelf: "center",
        justifyContent: "center",
        backgroundColor: '#e2e2e2',
        height: "50%",
        width: "95%"
    },
    lastTransactionExample: {
        position: 'relative',
        alignSelf: "center",
    },
})

export default Homepage;
