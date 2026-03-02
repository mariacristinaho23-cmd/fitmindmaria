import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Repeat, Dumbbell, BookOpen, TrendingUp, Library } from 'lucide-react-native';
import { theme } from '../styles/theme';

import HomeScreen from '../screens/HomeScreen';
import ReprogramacionScreen from '../screens/ReprogramacionScreen';
import FitnessScreen from '../screens/FitnessScreen';
import EstudioScreen from '../screens/EstudioScreen';
import ProgresoScreen from '../screens/ProgresoScreen';
import BibliotecaScreen from '../screens/BibliotecaScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.background,
                    shadowColor: 'transparent',
                    elevation: 0,
                },
                headerTitleStyle: {
                    ...theme.typography.h2,
                    color: theme.colors.text,
                },
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: '#F0EBE1',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textLight,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    title: 'Inicio'
                }}
            />
            <Tab.Screen
                name="Reprogramación"
                component={ReprogramacionScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} />,
                    title: 'Mente'
                }}
            />
            <Tab.Screen
                name="Fitness"
                component={FitnessScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
                    title: 'Fitness'
                }}
            />
            <Tab.Screen
                name="Estudio"
                component={EstudioScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
                    title: 'Estudio'
                }}
            />
            <Tab.Screen
                name="Progreso"
                component={ProgresoScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
                    title: 'Progreso'
                }}
            />
            <Tab.Screen
                name="Biblioteca"
                component={BibliotecaScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
                    title: 'Biblioteca'
                }}
            />
        </Tab.Navigator>
    );
}
