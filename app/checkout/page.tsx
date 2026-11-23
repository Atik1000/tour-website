"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getCart, createBooking, BookingPayload, TravelerDetail } from "@/services/tourService"

import { isLoggedIn, getUserProfile, updateUserProfile } from "@/services/authService"
import { Loader2, User, Mail, Globe, Check, CheckCircle2, AlertCircle, ShieldCheck, ChevronsUpDown } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { countries } from "@/lib/countries"
import { WhatsAppInput, parseWhatsApp, findCountry } from "@/components/whatsapp-input"


export default function CheckoutPage() {
    const [loading, setLoading] = useState(true)
    const [loggedIn, setLoggedIn] = useState(false)
    const [step, setStep] = useState(1) // 1: Contact Info (Guest), 2: Traveler Details
    const [totalAdults, setTotalAdults] = useState(0)
    const [openCountry, setOpenCountry] = useState(false)

    const [isBookNow, setIsBookNow] = useState(false)

    // Message Modal State
    const [messageModalOpen, setMessageModalOpen] = useState(false)
    const [messageModalTitle, setMessageModalTitle] = useState("")
    const [messageModalContent, setMessageModalContent] = useState("")
    const [onModalClose, setOnModalClose] = useState<(() => void) | null>(null)

    const showMessage = (title: string, content: string, onClose?: () => void) => {
        setMessageModalTitle(title)
        setMessageModalContent(content)
        if (onClose) {
            setOnModalClose(() => onClose)
        } else {
            setOnModalClose(null)
        }
        setMessageModalOpen(true)
    }

    // Forms
    const [guestDetails, setGuestDetails] = useState({
        full_name: "",
        email: "",
        country: "",
        phone: ""
    })

    const [travelerDetails, setTravelerDetails] = useState<TravelerDetail[]>([])
    // WhatsApp number saved on the signed-in account, to tell whether checkout changed it.
    const [profilePhone, setProfilePhone] = useState("")
    const [savingContact, setSavingContact] = useState(false)

    useEffect(() => {
        checkAuthAndLoad()
    }, [])

    const checkAuthAndLoad = async () => {
        setLoading(true)
        const isUserLoggedIn = isLoggedIn()
        setLoggedIn(isUserLoggedIn)

        let prepopulatedName = "";
        if (isUserLoggedIn) {
            // Signed-in customers still see the contact step, filled in from their account.
            try {
                const profile = await getUserProfile();
                prepopulatedName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
                const phone = profile.phone ? String(profile.phone) : ""
                setProfilePhone(phone)
                setGuestDetails({
                    full_name: prepopulatedName,
                    email: profile.email || "",
                    country: profile.country || findCountry(parseWhatsApp(phone).iso)?.name || "",
                    phone,
                })
            } catch (error) {
                console.error("Failed to fetch user profile", error);
            }
        } else {
            const savedGuest = localStorage.getItem('guestCheckoutDetails');
            if (savedGuest) {
                try {
                    const parsed = JSON.parse(savedGuest);
                    prepopulatedName = parsed.full_name || "";
                    setGuestDetails(parsed);
                } catch (e) {
                    console.error("Failed to parse guest details", e);
                }
            }
        }

        // Check for Book Now data first
        const bookNowDataStr = localStorage.getItem('bookNowData')
        let bookNowMode = false
        if (bookNowDataStr) {
            try {
                const bookNowData = JSON.parse(bookNowDataStr)
                setIsBookNow(true)
                bookNowMode = true

                // Set adults count directly from data
                const adults = bookNowData.num_adults || 0 // Default to 0 if not found, though interface implies it exists
                setTotalAdults(adults)

                // Initialize traveler details with prepopulated name for first traveler
                const initialTravelers = Array(adults).fill({ name: "" }).map((t, i) =>
                    i === 0 && prepopulatedName ? { ...t, name: prepopulatedName } : t
                );
                setTravelerDetails(initialTravelers)

                setLoading(false)
                return; // Skip cart loading
            } catch (e) {
                console.error("Failed to parse book now data", e)
                // Fallthrough to cart logic
            }
        }

        // Load cart for adult count if not book now
        const cartIdsStr = localStorage.getItem('cartItemId')
        if (!cartIdsStr) {
            setLoading(false)
            return
        }

        const ids = cartIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(n => !isNaN(n))

        try {
            const cartResponse = await getCart(ids)
            // Calculate total adults across all items
            const adults = cartResponse.results.reduce((acc, item) => acc + item.num_adults, 0)
            setTotalAdults(adults)

            // Initialize traveler details array with prepopulated name for first traveler
            const initialTravelers = Array(adults).fill({ name: "" }).map((t, i) =>
                i === 0 && prepopulatedName ? { ...t, name: prepopulatedName } : t
            );
            setTravelerDetails(initialTravelers)
        } catch (error) {
            console.error("Failed to load cart for checkout", error)
        } finally {
            setLoading(false)
        }
    }

    const handleGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (loggedIn) {
            // Bookings use the account's number, so save a new or changed one to the profile first.
            if (guestDetails.phone && guestDetails.phone !== profilePhone) {
                setSavingContact(true)
                try {
                    await updateUserProfile({ phone: guestDetails.phone })
                    setProfilePhone(guestDetails.phone)
                } catch (error: any) {
                    showMessage("Error", error.message || "Could not save your WhatsApp number. Please check it and try again.")
                    return
                } finally {
                    setSavingContact(false)
                }
            }
        } else {
            // Save to local storage
            localStorage.setItem('guestCheckoutDetails', JSON.stringify(guestDetails))
        }

        // Also update the first traveler's name if not already set or override it
        const newDetails = [...travelerDetails]
        if (newDetails.length > 0) {
            newDetails[0] = { ...newDetails[0], name: guestDetails.full_name }
            setTravelerDetails(newDetails)
        }

        setStep(2)
    }

    const handleTravelerChange = (index: number, field: keyof TravelerDetail, value: string) => {
        const newDetails = [...travelerDetails]
        newDetails[index] = { ...newDetails[index], [field]: value }
        setTravelerDetails(newDetails)
    }

    const handleFinalSubmit = async () => {
        setLoading(true)
        try {
            let payload: BookingPayload;

            if (isBookNow) {
                const bookNowDataStr = localStorage.getItem('bookNowData')
                if (!bookNowDataStr) throw new Error("Missing booking data")
                const bookNowData = JSON.parse(bookNowDataStr)

                payload = {
                    book_now: "true",
                    single_item: bookNowData,
                    traveler_details: travelerDetails
                }
            } else {
                const cartIdsStr = localStorage.getItem('cartItemId')
                if (!cartIdsStr) throw new Error("No items in cart")

                payload = {
                    cart_item_ids: cartIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(n => !isNaN(n)),
                    traveler_details: travelerDetails
                }
            }

            // Contact details from step 1 (guests type them, signed-in customers confirm them).
            payload.full_name = guestDetails.full_name
            payload.email = guestDetails.email
            payload.country = guestDetails.country
            payload.phone = guestDetails.phone

            let token = undefined;
            if (loggedIn) {
                const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
                if (match) {
                    token = match[2];
                }
            }

            await createBooking(payload, token)
            showMessage("Success", "Booking successful!", () => {
                // Cleanup
                if (isBookNow) {
                    localStorage.removeItem('bookNowData')
                } else {
                    localStorage.removeItem('cartItemId')
                }
                localStorage.removeItem('guestCheckoutDetails')
                window.location.href = "/"
            })

        } catch (error: any) {
            console.error("Booking failed", error)
            showMessage("Error", error.message || "Booking failed")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center h-[70vh]">
                    <Loader2 className="animate-spin text-orange-600" size={40} />
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <h1 className="text-3xl font-bold text-[#051036] mb-8">Checkout</h1>

                {/* Step 1: Contact Info (prefilled for signed-in customers) */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-[#051036] mb-6">Contact Details</h2>
                        <form onSubmit={handleGuestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="John Doe"
                                        value={guestDetails.full_name}
                                        onChange={e => setGuestDetails({ ...guestDetails, full_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="email"
                                        className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none read-only:bg-gray-50 read-only:text-gray-600"
                                        placeholder="john@example.com"
                                        readOnly={loggedIn}
                                        title={loggedIn ? "This is your account email" : undefined}
                                        value={guestDetails.email}
                                        onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <Popover open={openCountry} onOpenChange={setOpenCountry}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    role="combobox"
                                                    aria-expanded={openCountry}
                                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-left flex justify-between items-center text-sm transition-all hover:bg-gray-50 hover:border-blue-300"
                                                >
                                                    {guestDetails.country ? (
                                                        <span className="font-medium text-gray-900">
                                                            {countries.find((country) => country.name === guestDetails.country)?.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">Select Country</span>
                                                    )}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[310px] p-1 bg-white border border-gray-200 shadow-xl rounded-xl max-h-[400px]" align="start">
                                                <Command className="w-full">
                                                    <div className="px-2 pt-2 pb-1">
                                                        <CommandInput
                                                            placeholder="Search country..."
                                                            className="h-10 rounded-lg bg-gray-50 border-0 focus:ring-0 px-3 text-sm"
                                                        />
                                                    </div>
                                                    <div className="h-[1px] bg-gray-100 mx-2 mb-1" />
                                                    <CommandList className="max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                                                        <CommandEmpty className="py-6 text-center text-sm text-gray-500">No country found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {[...countries].sort((a, b) => {
                                                                if (a.name === guestDetails.country) return -1
                                                                if (b.name === guestDetails.country) return 1
                                                                return 0
                                                            }).map((country) => (
                                                                <CommandItem
                                                                    key={country.code}
                                                                    value={country.name}
                                                                    className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mx-1 my-0.5 group aria-selected:bg-blue-50"
                                                                    onSelect={(currentValue) => {
                                                                        setGuestDetails({ ...guestDetails, country: country.name })
                                                                        setOpenCountry(false)
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "flex items-center justify-center w-5 h-5 rounded-full border transition-all shrink-0",
                                                                        guestDetails.country === country.name
                                                                            ? "bg-blue-600 border-blue-600"
                                                                            : "border-gray-200 group-hover:border-blue-300"
                                                                    )}>
                                                                        {guestDetails.country === country.name && (
                                                                            <Check className="h-3 w-3 text-white" />
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col">
                                                                        <span className={cn(
                                                                            "font-medium transition-colors text-sm",
                                                                            guestDetails.country === country.name ? "text-blue-700" : "text-gray-700 group-hover:text-blue-700"
                                                                        )}>
                                                                            {country.name}
                                                                        </span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                                    <WhatsAppInput
                                        value={guestDetails.phone}
                                        onChange={(phone) => setGuestDetails((d) => ({ ...d, phone }))}
                                        countryHint={guestDetails.country}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">We&apos;ll send your booking details and updates here.</p>
                                </div>
                            </div>

                            <button type="submit" disabled={savingContact} className="w-full bg-[#0071EB] text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition mt-4 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2">
                                {savingContact && <Loader2 className="animate-spin" size={18} />}
                                Continue
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Traveler Details */}
                {step === 2 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-[#051036] mb-6">Traveler Details Form</h2>
                        <div className="space-y-6">
                            {travelerDetails.map((traveler, index) => (
                                <div key={index} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                    <h3 className="font-semibold text-gray-800 mb-3">Adult {index + 1}</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                                value={traveler.name}
                                                onChange={e => handleTravelerChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleFinalSubmit}
                            className="w-full bg-[#0071EB] text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition mt-8 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Check size={20} />
                            Final Submit
                        </button>
                    </div>
                )}
            </main>

            <Footer />

            <AlertDialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
                <AlertDialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
                    <div className={`p-6 flex flex-col items-center justify-center border-b ${messageModalTitle === "Success" ? "bg-green-50 border-green-100" :
                        messageModalTitle === "Error" ? "bg-red-50 border-red-100" :
                            "bg-blue-50 border-blue-100"
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${messageModalTitle === "Success" ? "bg-green-100" :
                            messageModalTitle === "Error" ? "bg-red-100" :
                                "bg-blue-100"
                            }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${messageModalTitle === "Success" ? "bg-green-200" :
                                messageModalTitle === "Error" ? "bg-red-200" :
                                    "bg-blue-200"
                                }`}>
                                {messageModalTitle === "Success" ? (
                                    <CheckCircle2 className="text-green-600 w-6 h-6" />
                                ) : messageModalTitle === "Error" || messageModalTitle.includes("Failed") ? (
                                    <AlertCircle className="text-red-600 w-6 h-6" />
                                ) : (
                                    <ShieldCheck className="text-blue-600 w-6 h-6" />
                                )}
                            </div>
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900 text-center">{messageModalTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-gray-600 mt-2 max-w-[280px]">
                            {messageModalContent}
                        </AlertDialogDescription>
                    </div>
                    <AlertDialogFooter className="p-6 pt-0 bg-white">
                        <AlertDialogAction
                            onClick={() => {
                                setMessageModalOpen(false)
                                if (onModalClose) onModalClose()
                            }}
                            className={`w-full cursor-pointer py-3 h-auto rounded-lg font-bold text-white shadow-md transition-all ${messageModalTitle === "Success" ? "bg-green-600 hover:bg-green-700 shadow-green-200" :
                                messageModalTitle === "Error" ? "bg-red-600 hover:bg-red-700 shadow-red-200" :
                                    "bg-[#051036] hover:bg-[#0a1e5c] shadow-blue-200"
                                }`}
                        >
                            OK, Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
