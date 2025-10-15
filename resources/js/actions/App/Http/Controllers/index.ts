import Auth from './Auth'
import LogFormatterController from './LogFormatterController'
import Settings from './Settings'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    LogFormatterController: Object.assign(LogFormatterController, LogFormatterController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers