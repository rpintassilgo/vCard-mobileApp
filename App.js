import React,{ useEffect } from "react";
import {StyleSheet, Text, View, LogBox} from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Freshman from "./components/Freshman";
import Homepage from "./components/Homepage";
import Contactspage from "./components/Contactspage";
import Piggybank from "./components/Piggybank";
import Transactionspage from "./components/Transactionspage";
import FlashMessage from "react-native-flash-message";


export default function App(){

    const Stack = createNativeStackNavigator();


    LogBox.ignoreAllLogs();

    return (
        <NavigationContainer>
                <Stack.Navigator initialRouteName="Freshman">
                    <Stack.Screen name="Freshman" component={Freshman} />
                    <Stack.Screen name="Homepage" component={Homepage} options={{  headerBackVisible: false }}/>
                    <Stack.Screen name="Contactspage" component={Contactspage} />
                    <Stack.Screen name="Piggybank" component={Piggybank} />
                    <Stack.Screen name="Transactionspage" component={Transactionspage} options={{ title: 'Transactions' }}/>
                </Stack.Navigator>
                <FlashMessage position="top" />
        </NavigationContainer>
    )

};



