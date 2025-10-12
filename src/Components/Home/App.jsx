// Todo List at homepage XD

// 1. Fix the background color of the navigation bar to be more transparent
// 2. Add smooth scrolling to the navigation links
// 3. Implement responsive design for mobile devices
// 4. Add animations to the skillset progress bars
// 5. Optimize images for faster loading times
// 6. Add a dark mode toggle
// 7. Improve accessibility by adding ARIA labels and roles
// 8. Add a footer section with social media links and copyright information
// 9. Implement form validation for the contact form
// 10. Add a loading spinner while the page is loading
// 11. Optimize the website for SEO

// Contents needed:
// 1.Homepage
// 2.About Page
// 3.Skillset Page
// 4.Project Page
// 5.Contact Page

import './App.css'
import "@fortawesome/fontawesome-free/css/all.min.css"
import NavigationBar from '../Navigation/App.jsx'

const Home = () => {
    return (
        <div className="home wrap" id='home'>
            <h1>Hello World From Home</h1>
        </div>
    )
}

const About = () => {
    return (
        <div className="about wrap" id='about'> 
            <h1>Hello World From About</h1>
        </div>
    )
}

const Skillset = () => {
    return (
        <div className="skillset wrap" id='skillset'>
            <h1>Hello World From Skillset</h1>
        </div>
    )
}

const Project = () => {
    return (
        <div className="project wrap" id='project'>
            <h1>Hello World From Project</h1>
        </div>
    )
}

const Contact = () => {
    return (
        <div className="contact wrap" id='contact'>
            <h1>Hello World From Contact</h1>
        </div>
    )
}

const Foot = () => {
    return (
        <div className="foot wrap">      
            <h1>Hello World From Foot</h1>
        </div>
    )
}


const Main = () => {
    return (
        <>
            <div className="wrap-nav">
                <NavigationBar/>
            </div>
            {/* <div className="closed-gap">
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
            </div> */}
            <div className="main-parrents">
                <Home/>
                <About/>
                <Skillset/>
                <Project/>
                <Contact/>
                <Foot/>
            </div>
        </>
    )
}

export default Main
