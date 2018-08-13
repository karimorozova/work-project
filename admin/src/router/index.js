import Vue from 'vue'
import Router from 'vue-router'
import Register from '@/components/Register'
import Login from '@/components/Login'
import Requests from '@/components/Requests'
import TasksReport from '@/components/TasksReport'
import Main from '@/components/Main'
import DashboardSettings from '@/components/sliders/DashboardSettings'
import RecruitmentSettings from '@/components/sliders/RecruitmentSettings'
import VendorsSettings from '@/components/sliders/VendorsSettings'
import LanguagesSettings from '@/components/sliders/LanguagesSettings'
import ClientsSettings from '@/components/sliders/ClientsSettings'
import QuotesSettings from '@/components/sliders/QuotesSettings'
import ProjectsSettings from '@/components/sliders/ProjectsSettings'
import FinanceSettings from '@/components/sliders/FinanceSettings'
import ReportsSettings from '@/components/sliders/ReportsSettings'
import Clientrequest from '@/components/request-forms/Clientrequest'
import Accountinfo from '@/components/account/Accountinfo'
import Allclients from '@/components/clients/Allclients'
import ClientDetails from '@/components/clients/ClientDetails'
import ContactDetails from '@/components/clients/ContactDetails'


Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/tasks-report',
      name: 'tasks-report',
      component: TasksReport
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      name: 'main',
      redirect: '/dashboard',
      component: Main,
      props: true,
      beforeEnter: (to, from, next) => {
        if(localStorage.getItem("token")) {
          let tokenObject = JSON.parse(localStorage.getItem("token"));
          let tokenDate = new Date(tokenObject.timestamp).getTime();
          let date = new Date().getTime()
          if(tokenDate <= date) {
            localStorage.removeItem("token")
            next('/login')  
          } else {
            next()
          }
        next()
        } else {
          next('/login')
        }
      },
      children: [
        {
          path: 'accountinfo',
          name: 'accountinfo',
          component: Accountinfo
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          props: true,
          component: DashboardSettings
        },
        {
          path: 'recruitment',
          name: 'recruitment',
          component: RecruitmentSettings
        },
        {
          path: 'vendors',
          name: 'vendors',
          component: VendorsSettings
        },
        {
          path: 'languages',
          name: 'languages',
          component: LanguagesSettings
        },
        {
          path: 'clients',
          name: 'clients',
          component: ClientsSettings
        },
        {
          path: 'quotes',
          name: 'quotes',
          component: QuotesSettings
        },
        {
          path: 'projects',
          name: 'projects',
          component: ProjectsSettings
        },
        {
          path: 'finance',
          name: 'finance',
          component: FinanceSettings
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsSettings
        },
        {
          path: 'translation-request',
          name: 'translation',
          component: Clientrequest
        }
      ]
    },
  ]
})
