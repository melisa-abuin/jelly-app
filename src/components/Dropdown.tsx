import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import './Dropdown.css'

const Dropdown = () => {
    const dropdown = useDropdownContext()

    return dropdown.dropdownNode
}

export default Dropdown
