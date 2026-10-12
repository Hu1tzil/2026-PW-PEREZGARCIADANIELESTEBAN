import Menu from '../components/Menu'

import '../styles/style.css';

export default function App({Component, pagesProps}){
    return(
        <>
            <Menu />
            <Component {...pagesProps}/>
        </>
    )
}