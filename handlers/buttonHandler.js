// Button Handler untuk semua button interactions dalam game
// Menangani prolog buttons, dynamic action buttons, dan button interactions lainnya

const { handlePrologueButton } = require('../game_logic/prologue');
const { handlePrologueChoice } = require('../game_logic/prologue_handler');
const { handleDynamicActionButton } = require('./dynamicActionHandler');

/**
 * Handler utama untuk semua button interactions
 * @param {Object} interaction - Discord button interaction
 */
async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    
    console.log(`[BUTTON] Button pressed: ${customId} by ${interaction.user.id}`);
    
    try {
        // Handle prologue choice buttons (new system)
        if (customId.startsWith('prologue_choice_')) {
            const handled = await handlePrologueChoice(interaction);
            if (handled) {
                console.log(`[BUTTON] Prologue choice handled: ${customId}`);
                return;
            }
        }

        // Handle prologue buttons (original system)
        if (customId.startsWith('prologue_')) {
            const handled = await handlePrologueButton(interaction);
            if (handled) {
                console.log(`[BUTTON] Prologue button handled: ${customId}`);
                return;
            }
        }

        // Handle dynamic action buttons (new system)
        if (customId.startsWith('dynamic_action_')) {
            const handled = await handleDynamicActionButton(interaction);
            if (handled) {
                console.log(`[BUTTON] Dynamic action button handled: ${customId}`);
                return;
            }
        }

        // Handle other button types here in the future
        // if (customId.startsWith('profile_')) { ... }
        // if (customId.startsWith('shop_')) { ... }
        
        // If no handler found
        console.log(`[BUTTON] No handler found for button: ${customId}`);
        
        // Send ephemeral response to acknowledge the interaction
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '⚠️ Button handler tidak ditemukan. Silakan coba lagi atau hubungi admin.',
                ephemeral: true
            });
        }
        
    } catch (error) {
        console.error('[BUTTON] Error handling button interaction:', error);
        
        // Send error response if interaction hasn't been handled
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: '❌ Terjadi kesalahan saat memproses button. Silakan coba lagi.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('[BUTTON] Error sending error response:', replyError);
            }
        }
    }
}

module.exports = {
    handleButtonInteraction
};
