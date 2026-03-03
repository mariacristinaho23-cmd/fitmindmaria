// @ts-nocheck
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Repeat, Dumbbell, BookOpen, TrendingUp, ShoppingCart, Gift } from 'lucide-react-native';
import { theme } from '../styles/theme';

import HomeScreen from '../screens/HomeScreen';
import ReprogramacionScreen from '../screens/ReprogramacionScreen';
import FitnessScreen from '../screens/FitnessScreen';
import ProgresoScreen from '../screens/ProgresoScreen';
import TiendaScreen from '../screens/TiendaScreen';
import AccionesScreen from '../screens/AccionesScreen';

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
            {/* Estudio tab removed — study tasks live in Home */}
            <Tab.Screen
                name="Acciones"
                component={AccionesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Gift color={color} size={size} />,
                    title: 'Acciones'
                }}
            />
            <Tab.Screen
                name="Tienda"
                component={TiendaScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
                    title: 'Tienda'
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
            {/* Biblioteca screen removed per user request */}
        </Tab.Navigator>
    );
}
