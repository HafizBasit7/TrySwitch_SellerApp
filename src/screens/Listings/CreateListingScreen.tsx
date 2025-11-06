import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Image,
    Platform,
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { CreatePropertyListingRequest } from '../../types/propertyTypes';
import {
    PROPERTY_TYPES,
    HEATING_OPTIONS,
    COOLING_OPTIONS,
    PARKING_OPTIONS,
    LOT_UNITS,
    LotUnit
} from '../../types/propertyTypes';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useAuth } from '../../context/AuthContext';

interface MediaItem {
    url: string;
    uri: string;
    type: 'image' | 'video';
    fileName?: string;
}

interface CreateListingScreenProps {
    navigation: any;
}

const CreateListingScreen: React.FC<CreateListingScreenProps> = ({ navigation }) => {
    const { pickAndUploadMedia, pickAndUploadDocument, uploading, uploadingDocument } = useImagePicker();
    const { userInfo } = useAuth();

    const [formData, setFormData] = useState({
        propertyAddress: '',
        propertyType: '',
        yearBuilt: '',
        heatingSystems: [] as string[],
        coolingSystems: [] as string[],
        parking: [] as string[],
        price: '',
        bedrooms: '',
        bathrooms: '',
        lotSize: '',
        lotUnit: 'Acres' as LotUnit,
        squareFoot: '',
        description: '',
        networth: '',
        rehabEstimate: '',
        averageLeasePrice: '',
    });

    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [documentItems, setDocumentItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [dropdownModal, setDropdownModal] = useState<{ visible: boolean; type: string; options: string[]; isMulti: boolean }>({
        visible: false,
        type: '',
        options: [],
        isMulti: false
    });

    const MAX_IMAGES = 25;
    const MAX_VIDEOS = 1;

    // Calculate counts
    const imageCount = mediaItems.filter(item => item.type === 'image').length;
    const videoCount = mediaItems.filter(item => item.type === 'video').length;
    const canAddMoreImages = imageCount < MAX_IMAGES;
    const canAddMoreVideos = videoCount < MAX_VIDEOS;
    const canAddMoreMedia = canAddMoreImages || canAddMoreVideos;

    // UPDATED: Enhanced handleMultiSelect to handle "None" option
    const handleMultiSelect = (type: 'heating' | 'cooling' | 'parking', value: string) => {
        setFormData(prev => {
            const key = type === 'parking' ? 'parking' : `${type}Systems`;
            const currentArray = prev[key] || [];

            // If "None" is selected, clear all other options
            if (value === 'None') {
                return { ...prev, [key]: ['None'] };
            }

            // If selecting any other option, remove "None" if it exists
            const filteredArray = currentArray.filter(item => item !== 'None');
            
            const isSelected = filteredArray.includes(value);
            const newArray = isSelected
                ? filteredArray.filter(item => item !== value)
                : [...filteredArray, value];

            return { ...prev, [key]: newArray };
        });
    };

    const handleAddMedia = async () => {
        if (!canAddMoreMedia) {
            Toast.show({
                type: 'error',
                text1: 'Limit Reached',
                text2: `Maximum ${MAX_IMAGES} images and ${MAX_VIDEOS} video reached`,
                position: 'bottom',
            });
            return;
        }

           // Check if user is authenticated
        if (!userInfo?.id) {
            Toast.show({
                type: 'error',
                text1: 'Authentication Error',
                text2: 'Please log in to upload media',
                position: 'bottom',
            });
            return;
        }

        try {
             const mediaResult = await pickAndUploadMedia(userInfo.id, 'propertyImages');

            if (mediaResult) {
                // Check limits before adding
                if (mediaResult.type === 'image' && !canAddMoreImages) {
                    Toast.show({
                        type: 'error',
                        text1: 'Limit Reached',
                        text2: `Maximum ${MAX_IMAGES} images allowed`,
                        position: 'bottom',
                    });
                    return;
                }

                if (mediaResult.type === 'video' && !canAddMoreVideos) {
                    Toast.show({
                        type: 'error',
                        text1: 'Limit Reached',
                        text2: `Maximum ${MAX_VIDEOS} video allowed`,
                        position: 'bottom',
                    });
                    return;
                }

                setMediaItems(prev => [...prev, mediaResult]);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Media uploaded successfully',
                    position: 'bottom',
                });
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to upload media. Please try again.',
                position: 'bottom',
            });
        }
    };

    const handleDocumentUpload = async () => {
          if (!userInfo?.id) {
            Toast.show({
                type: 'error',
                text1: 'Authentication Error',
                text2: 'Please log in to upload documents',
                position: 'bottom',
            });
            return;
        }
        
        try {
           const documentResult = await pickAndUploadDocument(userInfo.id, 'propertyImages');

            console.log('📄 Document upload result:', documentResult);

            if (documentResult) {
                setDocumentItems(prev => [...prev, documentResult]);
                console.log('✅ Document URL added to state:', documentResult);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Document uploaded successfully',
                    position: 'bottom',
                });
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to upload document. Please try again.',
                position: 'bottom',
            });
        }
    };

    const removeMedia = (index: number) => {
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index: number) => {
        setDocumentItems(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        const validations = [
            { condition: !formData.propertyAddress.trim(), message: 'Please enter property address' },
            { condition: !formData.propertyType.trim(), message: 'Please select property type' },
            { condition: !formData.yearBuilt.trim(), message: 'Please enter year built' },
            { condition: !formData.heatingSystems.length, message: 'Please select heating systems' },
            { condition: !formData.coolingSystems.length, message: 'Please select cooling systems' },
            { condition: !formData.price.trim(), message: 'Please enter price' },
            { condition: !formData.bedrooms.trim(), message: 'Please enter number of bedrooms' },
            { condition: !formData.bathrooms.trim(), message: 'Please enter number of bathrooms' },
            { condition: !formData.parking.length, message: 'Please select parking options' },
            { condition: !formData.lotSize.trim(), message: 'Please enter lot size' },
            { condition: !formData.squareFoot.trim(), message: 'Please enter square footage' },
            { condition: !formData.description.trim(), message: 'Please enter description' },
            { condition: imageCount === 0, message: 'Please upload at least one image' },
        ];

        const failedValidation = validations.find(validation => validation.condition);
        if (failedValidation) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: failedValidation.message,
                position: 'bottom',
            });
            return false;
        }

        return true;
    };

    const handlePreviewListing = () => {
        if (!validateForm()) return;

        // Prepare data for preview screen
        const previewData = {
            formData,
            mediaItems,
            documentItems,
            imageCount,
            videoCount
        };

        console.log('📋 Navigating to preview screen with data');
        
        // Navigate to PreviewListingScreen with all the data
        navigation.navigate('PreviewListing', { listingData: previewData });
    };

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const openDropdownModal = (type: string, options: string[], isMulti: boolean = false) => {
        setDropdownModal({
            visible: true,
            type,
            options,
            isMulti
        });
    };

    const closeDropdownModal = () => {
        setDropdownModal({
            visible: false,
            type: '',
            options: [],
            isMulti: false
        });
    };

    const handleDropdownSelect = (value: string) => {
        if (dropdownModal.isMulti) {
            if (dropdownModal.type === 'heating') handleMultiSelect('heating', value);
            else if (dropdownModal.type === 'cooling') handleMultiSelect('cooling', value);
            else if (dropdownModal.type === 'parking') handleMultiSelect('parking', value);
        } else {
            if (dropdownModal.type === 'propertyType') updateFormData('propertyType', value);
            else if (dropdownModal.type === 'lotUnit') updateFormData('lotUnit', value);
            closeDropdownModal();
        }
    };

    const getSelectedOptionsText = (type: 'heating' | 'cooling' | 'parking') => {
        const key = type === 'parking' ? 'parking' : `${type}Systems`;
        const selected = formData[key] || [];

        if (selected.length === 0) {
            return `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        }

        return selected.length <= 2
            ? selected.join(', ')
            : `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`;
    };

    const getSelectedValue = (type: string) => {
        switch (type) {
            case 'propertyType': return formData.propertyType;
            case 'heating': return formData.heatingSystems;
            case 'cooling': return formData.coolingSystems;
            case 'parking': return formData.parking;
            case 'lotUnit': return formData.lotUnit;
            default: return '';
        }
    };

    const isOptionSelected = (option: string) => {
        if (dropdownModal.isMulti) {
            const selected = getSelectedValue(dropdownModal.type);
            return Array.isArray(selected) && selected.includes(option);
        } else {
            return getSelectedValue(dropdownModal.type) === option;
        }
    };

    const renderDropdownButton = (
        name: string,
        placeholder: string,
        options: readonly string[],
        isMulti: boolean = false
    ) => {
        const selectedValue = getSelectedValue(name);

        return (
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => openDropdownModal(name, [...options], isMulti)}
            >
                <Text style={selectedValue && (Array.isArray(selectedValue) ? selectedValue.length > 0 : selectedValue) ? styles.dropdownTextFilled : styles.dropdownText}>
                    {isMulti
                        ? (Array.isArray(selectedValue) && selectedValue.length > 0
                            ? (selectedValue.length <= 2 ? selectedValue.join(', ') : `${selectedValue.slice(0, 2).join(', ')} +${selectedValue.length - 2}`)
                            : placeholder)
                        : (selectedValue || placeholder)
                    }
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
        );
    };

    // UPDATED: Media preview stack renderer like EditListingScreen
    const renderMediaPreviewStack = () => {
        if (mediaItems.length === 0) {
            return (
                <View style={styles.uploadIcon}>
                    <Image
                        source={require('../../assets/icons/media.png')}
                        style={styles.uploadIconText}
                    />
                    <Text style={styles.uploadText}>Upload Media</Text>
                </View>
            );
        }

        return (
            <View style={styles.stackContainer}>
                {mediaItems.slice(0, 5).map((item, index) => (
                    <View
                        key={`${item.url}-${index}`}
                        style={[styles.stackItem, { left: index * 25, zIndex: index }]}
                    >
                        {item.type === 'image' ? (
                            <Image source={{ uri: item.url }} style={styles.stackImage} />
                        ) : (
                            <View style={styles.stackVideo}>
                                <Text style={styles.videoIcon}>🎥</Text>
                            </View>
                        )}
                    </View>
                ))}

                {/* Overlay */}
                <View style={styles.stackOverlay}>
                    <Text style={styles.overlayCount}>+{mediaItems.length} files attached</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image
                        source={require('../../assets/icons/back.png')}
                        style={styles.backIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Listing</Text>
            </View>

            <KeyboardAvoidingView   
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.formContainer}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* UPDATED: Upload Images Section - Matching EditListingScreen */}
                    <View style={styles.uploadSection}>
                        <TouchableOpacity
                            style={styles.uploadBox}
                            onPress={handleAddMedia}
                            disabled={uploading || !canAddMoreMedia}
                            activeOpacity={0.8}
                        >
                            {uploading ? (
                                <ActivityIndicator size="large" color="#FF4500" />
                            ) : (
                                renderMediaPreviewStack()
                            )}
                        </TouchableOpacity>

                        {/* Add More Button */}
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={handleAddMedia}
                            disabled={uploading}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={require('../../assets/icons/plus.png')}
                                style={styles.plusIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.addMoreText}>Add More</Text>
                        </TouchableOpacity>

                        {/* Media Preview Grid */}
                        {mediaItems.length > 0 && (
                            <View style={styles.mediaGrid}>
                                {mediaItems.map((item, index) => (
                                    <View key={`${item.url}-${index}`} style={styles.mediaPreviewItem}>
                                        {item.type === 'image' ? (
                                            <Image source={{ uri: item.url }} style={styles.previewImage} />
                                        ) : (
                                            <View style={styles.videoThumbnail}>
                                                <Text style={styles.videoIcon}>🎥</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.removeMediaButton}
                                            onPress={() => removeMedia(index)}
                                        >
                                            <Text style={styles.removeIcon}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Location Section */}
                    <View style={styles.section}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.sectionLabel}>Location</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.formGroup}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your Address"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.propertyAddress}
                                    onChangeText={(value) => updateFormData('propertyAddress', value)}
                                />
                                <TouchableOpacity style={styles.inputIconButton}>
                                    {/* <Text style={styles.inputIconText}>📍</Text> */}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Type */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Type</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        {renderDropdownButton('propertyType', 'Type', PROPERTY_TYPES, false)}
                    </View>

                    {/* Year Built */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Year Built</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add a Built"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.yearBuilt}
                                onChangeText={(value) => updateFormData('yearBuilt', value)}
                            />
                            <TouchableOpacity style={styles.inputIconButton}>
                                <Image
                                    source={require('../../assets/icons/calendar.png')}
                                    style={styles.inputIconText}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Heating */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Heating</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        {renderDropdownButton('heating', 'Add heating', HEATING_OPTIONS, true)}
                    </View>

                    {/* Cooling */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Cooling</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        {renderDropdownButton('cooling', 'Add Cooling', COOLING_OPTIONS, true)}
                    </View>

                    {/* Parking */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Parking</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        {renderDropdownButton('parking', 'Add Parking', PARKING_OPTIONS, true)}
                    </View>

                    {/* Price */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Price</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Price"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.price}
                                onChangeText={(value) => updateFormData('price', value)}
                            />
                        </View>
                    </View>

                    {/* Bedrooms */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Bedrooms</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Number of Bedrooms"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.bedrooms}
                                onChangeText={(value) => updateFormData('bedrooms', value)}
                            />
                        </View>
                    </View>

                    {/* Bathrooms */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Bathrooms</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Number of Bathrooms"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.bathrooms}
                                onChangeText={(value) => updateFormData('bathrooms', value)}
                            />
                        </View>
                    </View>

                    {/* Lot */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Lot</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        {renderDropdownButton('lotUnit', 'Acres', LOT_UNITS, false)}
                        <View style={styles.lotContainer}>
                            <TextInput
                                style={styles.lotInput}
                                placeholder="Add Acres"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.lotSize}
                                onChangeText={(value) => updateFormData('lotSize', value)}
                            />
                        </View>
                    </View>

                    {/* SqFt */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>SqFt</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add SqFt"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.squareFoot}
                                onChangeText={(value) => updateFormData('squareFoot', value)}
                            />
                        </View>
                    </View>

                    {/* ADDED: Market Value Opinion */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Market Value Opinion</Text>
                            {/* No * indicator as requested */}
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Market Value Opinion"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.networth}
                                onChangeText={(value) => updateFormData('networth', value)}
                            />
                        </View>
                    </View>

                    {/* ADDED: Rehab Estimate */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Rehab Estimate</Text>
                            {/* No * indicator as requested */}
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Rehab Estimate"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.rehabEstimate}
                                onChangeText={(value) => updateFormData('rehabEstimate', value)}
                            />
                        </View>
                    </View>

                    {/* ADDED: Average Lease Price */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Average Lease Price</Text>
                            {/* No * indicator as requested */}
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Average Lease Price"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.averageLeasePrice}
                                onChangeText={(value) => updateFormData('averageLeasePrice', value)}
                            />
                        </View>
                    </View>

                    {/* Documents */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Documents</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.documentUploadBox}
                            onPress={handleDocumentUpload}
                            disabled={uploadingDocument}
                        >
                            {uploadingDocument ? (
                                <ActivityIndicator size="large" color="#6b46c1" />
                            ) : (
                                <>
                                    <View style={styles.documentIconContainer}>
                                        <Text style={styles.documentIcon}>☁️</Text>
                                    </View>
                                    <Text style={styles.documentUploadText}>Upload files</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Document Preview */}
                        {documentItems.length > 0 && (
                            <View style={styles.documentsList}>
                                {documentItems.map((doc, index) => (
                                    <View key={index} style={styles.documentItem}>
                                        <View style={styles.documentPreview}>
                                            <Text style={styles.documentPreviewIcon}>📄</Text>
                                            <Text style={styles.documentName} numberOfLines={1}>
                                                {doc.split('/').pop() || 'Document'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.removeDocButton}
                                            onPress={() => removeDocument(index)}
                                        >
                                            <Text style={styles.removeDocIcon}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Description</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Type here..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={formData.description}
                                onChangeText={(value) => updateFormData('description', value)}
                            />
                        </View>
                    </View>

                    {/* Preview Listing Button */}
                    <TouchableOpacity
                        style={[styles.previewButton, loading && styles.previewButtonDisabled]}
                        onPress={handlePreviewListing}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.previewButtonText}>PREVIEW LISTING</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Dropdown Modal */}
            <Modal
                visible={dropdownModal.visible}
                transparent
                animationType="slide"
                onRequestClose={closeDropdownModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Select {dropdownModal.type.charAt(0).toUpperCase() + dropdownModal.type.slice(1)}
                            </Text>
                            <TouchableOpacity onPress={closeDropdownModal}>
                                <Text style={styles.closeModal}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScrollView}>
                            {dropdownModal.options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.modalOption,
                                        isOptionSelected(option) && styles.modalOptionSelected
                                    ]}
                                    onPress={() => handleDropdownSelect(option)}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        isOptionSelected(option) && styles.modalOptionTextSelected
                                    ]}>
                                        {option} {isOptionSelected(option) && '✓'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {dropdownModal.isMulti && (
                            <TouchableOpacity
                                style={styles.modalDoneButton}
                                onPress={closeDropdownModal}
                            >
                                <Text style={styles.modalDoneText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* UPDATED: Toast with proper bottom center positioning */}
            <Toast 
                config={{
                    success: (props) => (
                        <View style={styles.toastContainer}>
                            <View style={[styles.toast, styles.successToast]}>
                                {/* <Text style={styles.toastText1}>{props.text1}</Text> */}
                                <Text style={styles.toastText2}>{props.text2}</Text>
                            </View>
                        </View>
                    ),
                    error: (props) => (
                        <View style={styles.toastContainer}>
                            <View style={[styles.toast, styles.errorToast]}>
                                <Text style={styles.toastText1}>{props.text1}</Text>
                                <Text style={styles.toastText2}>{props.text2}</Text>
                            </View>
                        </View>
                    )
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#FF4500',
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        justifyContent: 'space-between',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        padding: 4,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: "center",
        flex: 1,
        marginRight: 50
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
        paddingBottom: 132,
    },
    uploadSection: {
        marginBottom: 20,
    },
    // UPDATED: Upload box styles to match EditListingScreen
    uploadBox: {
        backgroundColor: '#e3e7eb',
        borderRadius: 18,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        width: '77%',
        alignSelf: 'center',
        height: 180,
        overflow: 'hidden',
        position: 'relative',
    },
    stackContainer: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        paddingLeft: 16,
    },
    stackItem: {
        position: 'absolute',
        top: 0,
        width: 120,
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    stackImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    stackVideo: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoIcon: {
        fontSize: 28,
        color: '#fff',
    },
    stackOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '90%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    overlayCount: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: "right",
        alignItems: "flex-end",
        alignSelf: "flex-end",
        right: 10
    },
    uploadIcon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconText: {
        width: 60,
        height: 60,
        marginBottom: 12,
    },
    uploadText: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: '500',
    },
    addMoreButton: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        marginVertical: 16,
    },
    plusIcon: {
        width: 30,
        height: 30,
        marginBottom: 4,
    },
    addMoreText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '400',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    mediaPreviewItem: {
        position: 'relative',
        width: 70,
        height: 70,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeMediaButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 4,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 10,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    // ADDED: Label container for * indicators
    labelContainer: {
        position: 'relative',
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    required: {
        position: 'absolute',
        top: -4,
        right: -10,
        color: 'red',
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 14,
        color: '#374151',
    },
    inputIconButton: {
        padding: 4,
    },
    inputIconText: {
        width: 20,
        height: 20,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    dropdownTextFilled: {
        fontSize: 14,
        color: '#374151',
    },
    dropdownIcon: {
        fontSize: 14,
        color: '#9ca3af',
    },
    lotContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20
    },
    lotInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        color: '#374151',
    },
    documentUploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#6b46c1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    documentIconContainer: {
        width: 30,
        height: 30,
        backgroundColor: '#ede9fe',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
        marginTop: 8
    },
    documentIcon: {
        fontSize: 24,
    },
    documentUploadText: {
        color: '#6b46c1',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    documentsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    documentItem: {
        position: 'relative',
    },
    documentPreview: {
        width: 50,
        height: 50,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentPreviewIcon: {
        fontSize: 20,
    },
    documentName: {
        fontSize: 10,
        color: '#374151',
        marginTop: 4,
        textAlign: 'center',
        maxWidth: 50,
    },
    removeDocButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeDocIcon: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    textAreaContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textArea: {
        minHeight: 100,
        fontSize: 14,
        color: '#374151',
        textAlignVertical: 'top',
    },
    previewButton: {
        backgroundColor: '#FF4500',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    previewButtonDisabled: {
        opacity: 0.6,
    },
    previewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    closeModal: {
        fontSize: 20,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    modalScrollView: {
        maxHeight: 400,
    },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalOptionSelected: {
        backgroundColor: '#fef3e2',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    modalOptionTextSelected: {
        color: '#FF4500',
        fontWeight: '500',
    },
    modalDoneButton: {
        backgroundColor: '#FF4500',
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalDoneText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // ADDED: Toast styles for bottom center positioning
    toastContainer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    toast: {
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 8,
        marginHorizontal: 20,
        minWidth: 200,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successToast: {
        backgroundColor: '#10B981',
    },
    errorToast: {
        backgroundColor: '#EF4444',
    },
    toastText1: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    toastText2: {
        color: 'white',
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
});

export default CreateListingScreen;