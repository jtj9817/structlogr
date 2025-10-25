import Auth from './Auth'
import LogFormatterController from './LogFormatterController'
import HistoryController from './HistoryController'
import Settings from './Settings'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    LogFormatterController: Object.assign(LogFormatterController, LogFormatterController),
    HistoryController: Object.assign(HistoryController, HistoryController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers